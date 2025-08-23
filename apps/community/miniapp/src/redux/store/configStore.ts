import Taro from '@tarojs/taro';
import { createStore, applyMiddleware, compose } from 'redux';
import { createLogger } from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import rootReducer from '../reducers';
import rootSaga from '../sagas/index';
// import apiMiddleware from '../middlewares/apiMiddleware'
import sagaPromiseMiddleware from '../middlewares/sagaPromiseMiddleware';

const sagaMiddleware = createSagaMiddleware();
const middlewares = [sagaPromiseMiddleware, sagaMiddleware];

// 防止saga由于未捕捉异常而挂掉
function runSaga() {
    try {
        sagaMiddleware.run(rootSaga);
    } catch (err) {
        runSaga();
        throw err;
    }
}

export default function configStore(initialState = {}) {
    // 在小程序环境中不使用logger，避免性能问题
    if (Taro.getEnv() === Taro.ENV_TYPE.WEB) {
        middlewares.push(createLogger());
    }

    // 检查是否在浏览器环境中且存在Redux DevTools扩展
    const composeEnhancers =
        typeof window !== 'undefined' && window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__']
            ? window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__']
            : compose;
    const enhancers = composeEnhancers(applyMiddleware(...middlewares));

    const store = createStore(rootReducer, initialState, enhancers);

    // 确保store创建后再运行saga
    setTimeout(() => {
        runSaga();
    }, 0);

    return store;
}
