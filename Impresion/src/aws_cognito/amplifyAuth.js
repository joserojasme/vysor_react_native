import { Auth } from 'aws-amplify';

let dataResult = null;

export async function SignUp(data, setLoading) {
    
    await Auth.signUp({
        'username': data.username,
        'password': data.password,
        attributes: {
            'email': data.email,
            'phone_number': data.phone_number,
            'custom:fullname': data.fullname,
            'custom:userid': data.userid,
            'custom:username': data.username
        },
        validationData: []
    })
        .then(result => {
            
            dataResult = result;
        })
        .catch(err => {
            
            dataResult = err;
        });
    return dataResult;
}

export async function SignIn(data, setLoading) {
    
    try {
        const user = await Auth.signIn('JOSEROJASME', data.password).then(result=>{
            dataResult = 'SUCCESS';
        }).catch(err=>{
            dataResult = err
        })
    } catch (e) {
        dataResult = e.code;
    }
    return dataResult;
}

export async function ConfirmSignUp(username, verificationCode, setLoading) {
    
    await Auth.confirmSignUp(username, verificationCode, {
    }).then(result => {
        
        dataResult = result;
    })
        .catch(err => {
            
            dataResult = err;
        })
    return dataResult;
}

export async function GetUserData() {
    await Auth.currentAuthenticatedUser({
        bypassCache: false
    }).then(result => {
        dataResult = result
    })
        .catch(err => {
            dataResult = err
        });
    return dataResult;
}

export async function RetrieveCurrentSessionRefreshToken() {
        await Auth.currentSession().then(result => {
            dataResult = result;
        })
            .catch(err => {
                dataResult = err;
            });
        return dataResult;
}

export async function CompleteNewPassword(username, newPassword, attributes) {
    await Auth.completeNewPassword(
        username,
        newPassword,
        attributes //es un objeto
    ).then(result => {

    })
        .catch(err => {

        })
}

export async function ResendUserCodeSignUp(username) {
    let dataResult = null;
    await Auth.resendSignUp(username).then(result => {
        dataResult = result;
    }).catch(err => {
        dataResult = err;
    });
    return dataResult;
}

export async function ChangePassword(oldPassword, newPassword, setLoading) {
    
    await Auth.currentAuthenticatedUser()
        .then(user => {
            return Auth.changePassword(user, oldPassword, newPassword);
        })
        .then(result => {
            
            dataResult = result;
        })
        .catch(err => {
            
            dataResult = err;
        });
        return dataResult;
}

export async function ForgotPassword(username, setLoading) {
    
    await Auth.forgotPassword(username)
        .then(result => {
            
            dataResult = result;
        })
        .catch(err => {
            
            dataResult = err;
        });
        return dataResult;
}

export async function ForgotPasswordSubmit(username, code, newPassword, setLoading) {
    
    await Auth.forgotPasswordSubmit(username, code, newPassword)
        .then(result => result =>{
            
            dataResult = result;
        })
        .catch(err =>  {
            
            dataResult = err;
        });
        return dataResult;
}

export async function SignOut() {
    await Auth.signOut()
}

//Esta funcion deshabilita el usuario después de una hora de ser llamada
export async function SignOutGlobal() {
    await Auth.signOut({ global: true })
        /*.then(result => console.log(result))
        .catch(err => console.log(err));*/
}
