import { createStore } from 'redux';

// Initial state
const initialState = {
    profile: null
};

// Reducer
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

// Create store
const store = createStore(reducer);

export default store;
