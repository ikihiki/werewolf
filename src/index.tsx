import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import { store } from './store'
import { Provider } from 'react-redux'

ReactDOM.render(
/* eslint no-use-before-define: 0 */
  <React.StrictMode>
    <Provider store={store}>
      <div >hello </div>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
)
