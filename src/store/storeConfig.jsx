import { createSlice, configureStore } from "@reduxjs/toolkit"

const initialState = {
  systemname: 'DemoOX',
  userinfo: {
    lineid: '',
    linename: '........',
    linestatus: '....',
    linepic: 'https://placehold.co/400x400',
    score: 0,
    winarow: 0
  } ,
  isBattle: false,
  isRank: false,
  turnPlayer: true,
  winarow: 0,
  playerColor: 'pink',
  botColor: 'green',
  jsonalert: { color: '', point: 0, extrapoint: 0 },
  arrgameox: [
    { box: '1', chkby: '' },
    { box: '2', chkby: '' },
    { box: '3', chkby: '' },
    { box: '4', chkby: '' },
    { box: '5', chkby: '' },
    { box: '6', chkby: '' },
    { box: '7', chkby: '' },
    { box: '8', chkby: '' },
    { box: '9', chkby: '' }
  ]
}

const storeConfig = createSlice({
  name: 'reactdemoox',
  initialState: initialState,
  reducers: {
    setUserInfo(state, { payload }) {
      state.userinfo = payload
    },
    setTurnPlayer(state, { payload }) {
      state.turnPlayer = payload
    },
    setWinaRow(state, { payload }) {
      /* state.userinfo.winarow = (payload <= 0 ? 0 : (state.userinfo.winarow + 1)) */
      state.winarow = (payload <= 0 ? 0 : (state.winarow + 1))
      if (state.winarow >= 3 /* state.userinfo.winarow >= 3 */) {
        state.userinfo.score += 2
        /* state.userinfo.winarow = 0 */
        state.winarow = 0
        state.jsonalert.extrapoint = 1
      }
      else {
        state.userinfo.score += (state.userinfo.score >= 0 ? payload : 0)
      }

      state.jsonalert.color = (payload < 0 ? 'red' : payload > 0 ? 'green' : 'blue')
      state.jsonalert.point = payload
    },
    setClearAlert(state, {}) {
      state.jsonalert = { color: '', point: 0, extrapoint: 0 }
    },
    setPlayerColor(state, { payload }) {
      state.playerColor = ''
      state.botColor = ''
      let arrcolor = ['pink', 'green']
      if (payload) {
        state.playerColor = payload
        arrcolor = arrcolor.filter((txt) => txt !== payload)
        state.botColor = arrcolor[0]
      }
    },
    setPlayOX(state, { payload }) {
      state.arrgameox.map((item) => {
        if (item.box == payload) {
          item.chkby = (state.turnPlayer ? 'player' : 'bot')
        }
        return item
      })
      state.turnPlayer = !state.turnPlayer
    },
    setClearArrOX(state, {}) {
      state.arrgameox = [
        { box: '1', chkby: '' },
        { box: '2', chkby: '' },
        { box: '3', chkby: '' },
        { box: '4', chkby: '' },
        { box: '5', chkby: '' },
        { box: '6', chkby: '' },
        { box: '7', chkby: '' },
        { box: '8', chkby: '' },
        { box: '9', chkby: '' }
      ]
    },
  }
})

export const { setUserInfo, setTurnPlayer, setWinaRow, setClearAlert, setPlayerColor, setPlayOX, setClearArrOX } = storeConfig.actions
export default configureStore({
  reducer: storeConfig.reducer
})