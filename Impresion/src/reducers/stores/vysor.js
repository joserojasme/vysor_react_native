
const initialState = {
    data: {}
}

function vysor(state = initialState, action) {
    switch (action.type) {
        case 'SET_DATA': {
            return {
                ...state,
                data: action.payload.item
            }
        }
        
        default:
            return state
    }
}

export default vysor;