import { createSlice, configureStore } from "@reduxjs/toolkit"

const initialState = {
  systemname: 'DemoOX',
  userinfo: {
    linetoken: '',
    lineid: '',
    linename: '....XXXX....',
    linestatus: '..xx..',
    linepic: 'https://placehold.co/400x400',
    score: 0,
    winarow: 0
  } ,
  isBattle: false,
  isRank: false,
  turnPlayer: true,
  playerColor: 'pink',
  botColor: 'green',
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
  name: 'reactrmh',
  initialState: initialState,
  reducers: {
    setUserInfo(state, { payload }) {
      state.userinfo = payload
    },
    setIsBattle(state, { payload }) {
      state.isBattle = payload
    },
    setIsRank(state, { payload }) {
      state.isRank = payload
    },
    setTurnPlayer(state, { payload }) {
      state.turnPlayer = payload
    },
    setWinaRow(state, { payload }) {
      state.userinfo.winarow = (payload <= 0 ? 0 : state.userinfo.winarow++)
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

export const { setUserInfo, setIsBattle, setIsRank, setTurnPlayer, setWinaRow, setPlayerColor, setPlayOX, setClearArrOX } = storeConfig.actions
export default configureStore({
  reducer: storeConfig.reducer
})