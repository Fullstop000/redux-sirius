/* eslint-disable no-underscore-dangle */
import Sirius, { effects } from './index'

const delay = duration => new Promise(resolve => setTimeout(resolve, duration))
// no namespace / no reducers / no effects
const model0 = {
  state: {
    name: 'fuck',
    value: 0,
    lovers: [
      {
        name: 'qwe',
        sex: 1
      },
      {
        name: 'ewq',
        sex: 0
      }
    ]
  }
}
test('Should only exist one redux store', () => {
  const s = new Sirius()
  s.store()
  try {
    s.store()
  } catch (e) {
    expect(e.message).toBe('Only support one store')
  }
})
test('Sirius with empty models', () => {
  const s = new Sirius()
  s.store()
  expect(s._models.length).toBe(0)
})

test('Model without reducers', () => {
  const store = new Sirius({
    models: {
      test: model0
    }
  }).store()
  const state = store.getState()
  expect(state.test).toEqual({
    name: 'fuck',
    value: 0,
    lovers: [
      {
        name: 'qwe',
        sex: 1
      },
      {
        name: 'ewq',
        sex: 0
      }
    ]
  })
})

test('Model default reducers', () => {
  const store = new Sirius({
    models: {
      test: model0
    }
  }).store()
  store.dispatch({
    type: 'test/setName',
    payload: '~~~'
  })
  const state = store.getState()
  expect(state.test.name).toBe('~~~')
})

test('Model with customized reducers', () => {
  const store = new Sirius({
    models: {
      test: {
        ...model0,
        reducers: {
          setName: (state, { payload }) => {
            if (payload === 'test') {
              return { ...state, name: 'hello world' }
            } else {
              return { ...state, name: payload }
            }
          },
          setFirstLover: (state, { payload }) => {
            const { lovers } = state
            lovers[0] = payload
            return {
              ...state,
              lovers
            }
          }
        }
      }
    }
  }).store()
  store.dispatch({
    type: 'test/setName',
    payload: 'test'
  })
  store.dispatch({
    type: 'test/setFirstLover',
    payload: {
      name: 'good man',
      sex: '?'
    }
  })
  const state = store.getState()
  expect(state.test.name).toBe('hello world')
  expect(state.test.lovers[0]).toEqual({
    name: 'good man',
    sex: '?'
  })
})

test('Model with sagas', async () => {
  const store = new Sirius({
    models: {
      test: {
        ...model0,
        effects: {
          * replaceSecondLover ({ payload }) {
            const { put, select, call } = effects
            yield put({
              type: 'test/setName',
              payload: 'bad man'
            })
            yield call(delay, 200)
            const lovers = yield select(state => state.test.lovers)
            lovers[1] = payload
            yield call(delay, 500)
            yield put({
              type: 'test/setLovers',
              payload: lovers
            })
          }
        }
      }
    }
  }).store()
  store.dispatch({
    type: 'test/replaceSecondLover',
    payload: {
      name: 'bad man',
      sex: 10
    }
  })
  await delay(700)
  const state = store.getState()
  expect(state.test.name).toBe('bad man')
  expect(state.test.lovers[1]).toEqual({
    name: 'bad man',
    sex: 10
  })
})

test('Dynamic add model', async () => {
  const s = new Sirius({
    models: {
      switch: {
        state: true,
        reducers: {
          switch: state => !state
        }
      }
    }
  })
  const store = s.store()
  let state = store.getState()
  expect(state.switch).toBe(true)
  s.addModel({
    namespace: 'counter',
    state: 0,
    reducers: {
      increment: state => state + 1,
      decrement: state => state - 1
    },
    effects: {
      * asyncSwitch () {
        const { put } = effects
        yield delay(300)
        yield put({type: 'switch/switch'})
      }
    }
  })
  state = store.getState()
  expect(state.counter).toBe(0)
  store.dispatch({type: 'counter/increment'})
  store.dispatch({type: 'counter/asyncSwitch'})
  await delay(300)
  state = store.getState()
  expect(state.counter).toBe(1)
  expect(state.switch).toBe(false)
})
