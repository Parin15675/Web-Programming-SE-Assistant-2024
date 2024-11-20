import { createStore } from 'redux';

const initialState = {
    profile: null
};

function reducer(state = initialState, action) {
    switch (action.type) {
        case 'SET_PROFILE':
            return { ...state, profile: action.payload };
        case 'LOGOUT':
            return { ...state, profile: null };
        default:
            return state;
    }
}

const store = createStore(reducer);

export default store;
