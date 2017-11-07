import { login, tokenLogin } from '../services/login'
import { routerRedux } from 'dva/router'
import { message } from 'antd'
import pathToRegexp from 'path-to-regexp'
import io from 'socket.io-client'
import { invert } from 'lodash'

import { queryURL } from '../utils'

import { flaskServer, translateDict } from '../constants'

export default {
  namespace: 'login',
  state: {
    loginLoading: false,
  },
  reducers: {
    changeLoginStatus(state, { payload }) {
      return {
        ...state,
        status: payload.status,
        type: payload.type,
      }
    },
    changeSubmitting(state, { payload }) {
      return {
        ...state,
        submitting: payload,
      }
    },
    showLoginLoading(state) {
      return {
        ...state,
        loginLoading: true,
      }
    },
    hideLoginLoading(state) {
      return {
        ...state,
        loginLoading: false,
      }
    },
    setUser(state, { payload: user }) {
      return {
        ...state,
        user,
      }
    },
    resetUser(state, { payload: user }) {
      return {
        ...state,
        user: undefined,
      }
    },
  },
  effects: {
    *accountSubmit({ payload }, { call, put }) {
      yield put({
        type: 'changeSubmitting',
        payload: true,
      })
      const response = yield call(fakeAccountLogin, payload)
      yield put({
        type: 'changeLoginStatus',
        payload: response,
      })
      yield put({
        type: 'changeSubmitting',
        payload: false,
      })
    },
    *mobileSubmit(_, { call, put }) {
      yield put({
        type: 'changeSubmitting',
        payload: true,
      })
      const response = yield call(fakeMobileLogin)
      yield put({
        type: 'changeLoginStatus',
        payload: response,
      })
      yield put({
        type: 'changeSubmitting',
        payload: false,
      })
    },
    *logout(_, { put }) {
      yield put({
        type: 'changeLoginStatus',
        payload: {
          status: false,
        },
      })
      yield put(routerRedux.push('/user/login'))
    },
    *login({
             payload,
           }, { put, call }) {
      yield put({
        type: 'changeSubmitting',
        payload: true,
      })
      const { data: data } = yield call(login, payload)
      yield put({
        type: 'changeSubmitting',
        payload: false,
      })
      if (data) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user_ID', data.user.user_ID)
        const from = queryURL('from')
        yield put({ type: 'setUser', payload: data.user })
        if (from) {
          yield put(routerRedux.push(from))
        } else {
          yield put(routerRedux.push('/workspace'))
        }
      } else {
        throw data
      }
    },
    *query({ payload }, { call, put }) {
      try {
        const { data: data } = yield call(tokenLogin)
        yield put({
          type: 'setUser',
          payload: data.user,
        })
        // FIXME regex can't catch whole url
        // const from = queryURL('from')
        // if (from) {
        //   yield put(routerRedux.push(from))
        // }
        console.log(location.hash.substr(1))
        if (location.hash.substr(1) === '/login') {
          // user dashboard not build yet, push to project by default
          yield put(routerRedux.push('/workspace'))
        }
      } catch (err) {
        if (!(location.href.includes('/user/login') || location.href.includes('/user/register'))) {
          let from = location.pathname
          // window.location = `${location.origin}/login?from=${from}`
          // window.location = `${location.origin}/#/login`
          yield put(routerRedux.push('/user/login'))
        }
      }
    },
    *handleSocket({ payload }, { call, put }) {
      const { msg, pathname } = payload
      const projectIdMsg = msg.project_id
      const jobIdMsg = msg.job_id
      const match = pathToRegexp('/workspace/:projectId*').exec(pathname)
      if (match) {
        const projectId = match[1]
        if (projectId === projectIdMsg) {

          // in project
          yield put({
            type: 'modelling/setMetrics',
            payload: { msg },
          })
        }
      }
    },
    *handleError({ payload }, { call, put }) {
      const { msg, pathname } = payload
      const projectIdMsg = msg.project_id
      const jobIdMsg = msg.job_id
      message.error(JSON.stringify(msg))
      yield put({ type: 'modelling/hideResult' })
      yield put({
        type: invert(translateDict)[msg.type] + '/setStatus', payload: {
          sectionId: jobIdMsg,
          status: 300,
        },
      })
      console.log(' '.join(msg.error))
      // console.log(msg.error)
    },
    *handleSuccess({ payload }, { call, put }) {
      const { msg, pathname } = payload
      const projectIdMsg = msg.project_id
      const jobIdMsg = msg.job_id
      message.success(msg.content)
      yield put({
        type: invert(translateDict)[msg.type] + '/setStatus', payload: {
          sectionId: jobIdMsg,
          status: 200,
        },
      })
      // console.log(' '.join(msg.error))
      // console.log(msg.error)
    },
  },
  subscriptions: {
    setup({ dispatch, history }) {
      return history.listen(({ pathname }) => {
        const match = pathToRegexp('/user/login').exec(pathname)
        if (!match) {dispatch({ type: 'query' })}
        const userId = localStorage.getItem('user_ID')
        if (userId) {
          const socket = io.connect(flaskServer + '/log/' + userId)
          socket.on('log_epoch_end', (msg) => {
            dispatch({ type: 'handleSocket', payload: { msg, pathname } })
          })
          socket.on('error', (msg) => {
            console.log(msg)
            dispatch({ type: 'handleError', payload: { msg, pathname } })
          })
          socket.on('success', (msg) => {
            console.log(msg)
            dispatch({ type: 'handleSuccess', payload: { msg, pathname } })
          })
        }
      })
    },
  },
}

