import {useState, useEffect, useContext, useCallback, useRef} from 'react'
import {useNavigate} from 'react-router'
import {ThreeDots} from 'react-loader-spinner'
import Header from '../Header'
import QuestionType from '../QuestionType'
import Timer from '../Timer'
import ScoreAndTimeContext from '../../context/ScoreAndTimeContext'

import './index.css'

const apiStatusConstants = {
  initial: 'INITIAL',
  inProgress: 'IN_PROGRESS',
  success: 'SUCCESS',
  failure: 'FAILURE',
}

const Assessment = () => {
  const [response, setResponse] = useState({
    status: apiStatusConstants.inProgress,
    data: null,
    total: null,
    errorMsg: null,
  })
  const [count, setCount] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState([])
  const {setScore, setTimeRemains} = useContext(ScoreAndTimeContext)
  const navigate = useNavigate()
  const hasSubmitted = useRef(false)

  const onAnsweredQuestions = (qId, ansId) => {
    setAnsweredQuestions(prev => {
      const filteredAnswers = prev.filter(item => item.qId !== qId)
      return [...filteredAnswers, {qId, ansId}]
    })
  }

  const calculateScore = () => {
    let currentScore = 0

    answeredQuestions.forEach(answer => {
      const question = response.data.find(item => item.id === answer.qId)
      const correctAnswer = question.options.find(
        option =>
          option.isCorrect === true || option.isCorrect === 'true',
      )

      if (correctAnswer && answer.ansId === correctAnswer.id) {
        currentScore += 1
      }
    })

    setScore(currentScore)
  }

  const submitAssessment = timeLeft => {
    if (hasSubmitted.current) {
      return
    }

    hasSubmitted.current = true
    calculateScore()

    setTimeRemains(timeLeft)
    navigate('/results')
  }

  const updatedData = data => {
    const questions = data.questions.map(item => {
      const {
        id,
        options_type: optionsType,
        question_text: questionText,
      } = item

      let updatedOptions

      if (optionsType === 'DEFAULT') {
        updatedOptions = item.options.map(option => ({
          id: option.id,
          isCorrect: option.is_correct,
          text: option.text,
        }))
      } else if (optionsType === 'IMAGE') {
        updatedOptions = item.options.map(option => ({
          id: option.id,
          isCorrect: option.is_correct,
          text: option.text,
          imageUrl: option.image_url,
        }))
      } else if (optionsType === 'SINGLE_SELECT') {
        updatedOptions = item.options.map(option => ({
          id: option.id,
          isCorrect: option.is_correct === 'true',
          text: option.text,
        }))
      }

      return {
        id,
        options: updatedOptions,
        optionsType,
        questionText,
      }
    })

    return questions
  }

  const getData = useCallback(
    () =>
      fetch('https://apis.ccbp.in/assess/questions')
        .then(async res => ({
          response: res,
          data: await res.json(),
        }))
        .then(({response: res, data: responseData}) => {
          if (res.ok) {
            setResponse({
              status: apiStatusConstants.success,
              total: responseData.total,
              data: updatedData(responseData),
              errorMsg: null,
            })
          } else {
            setResponse({
              status: apiStatusConstants.failure,
              data: null,
              total: null,
              errorMsg: responseData.error_msg,
            })
          }
        })
        .catch(error => {
          setResponse({
            status: apiStatusConstants.failure,
            data: null,
            total: null,
            errorMsg: error.message,
          })
        }),
    [],
  )

  const retryLoadingData = () => {
    setResponse({
      status: apiStatusConstants.inProgress,
      data: null,
      total: null,
      errorMsg: null,
    })
    getData()
  }

  useEffect(() => {
    getData()

    const handleBeforeUnload = event => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [getData])

  const onNextQuestion = () => {
    if (count < response.data.length - 1) {
      setCount(previousCount => previousCount + 1)
    }
  }

  const onSetQuestion = index => {
    const selectedQuestion = response.data[index]

    if (selectedQuestion.optionsType === 'SINGLE_SELECT') {
      const firstOption = selectedQuestion.options[0]?.id
      const alreadyAnswered = answeredQuestions.find(
        question => question.qId === selectedQuestion.id,
      )

      if (firstOption && !alreadyAnswered) {
        onAnsweredQuestions(selectedQuestion.id, firstOption)
      }
    }

    setCount(index)
  }

  const renderSuccessView = () => {
    const question = response.data[count]

    return (
      <div className="question-container">
        <Timer
          response={response}
          answeredQuestions={answeredQuestions}
          onSetQuestion={onSetQuestion}
          count={count}
          submitAssessment={submitAssessment}
        />
        <QuestionType
          key={question.id}
          question={question}
          count={count}
          onNextQuestion={onNextQuestion}
          onAnsweredQuestions={onAnsweredQuestions}
          answeredQuestions={answeredQuestions}
          response={response}
        />
      </div>
    )
  }

  const renderFailureView = () => (
    <div className="err-container">
      <img
        className="failure-img"
        src="https://res.cloudinary.com/dngzbeidb/image/upload/v1727146364/ml55hvnmm1r3bw32xjtw.png"
        alt="failure view"
      />
      <h1 className="failure-head">Oops! Something went wrong</h1>
      <p className="failure-txt">We are having some trouble</p>
      <button type="button" className="retry-btn" onClick={retryLoadingData}>
        Retry
      </button>
    </div>
  )

  const renderLoadingView = () => (
    <div className="loader-container" data-testid="loader">
      <ThreeDots
        color="#263868"
        height={50}
        width={50}
        ariaLabel="three-dots-loading"
      />
    </div>
  )

  const renderAssessment = () => {
    switch (response.status) {
      case apiStatusConstants.inProgress:
        return renderLoadingView()
      case apiStatusConstants.success:
        return renderSuccessView()
      case apiStatusConstants.failure:
        return renderFailureView()
      default:
        return null
    }
  }

  return (
    <div className="assessment-container">
      <Header />
      {renderAssessment()}
    </div>
  )
}

export default Assessment