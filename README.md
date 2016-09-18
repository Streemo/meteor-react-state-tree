# meteor-react-state-tree
Store global state for Meteor with a very simple-to-use API. **React is not necessary at all**, but it presents a common use-case. **Recommended for Blaze and React**, and other view layers as well!

## Summary
This package makes keeping track of **form state**, **modal state**, **snackbar state**, **toast state**, and any other **global or local state** very easy. It is designed to make use of Minimongo's scoped reactivity, to ensure that only the necessary parts of your application are re-run in response to global or local state change. This package is about 40 lines code, and requires only `Meteor`, and client-side `Mongo`. It presents five methods on `State` objects: `get`, `set`, `memorize`, `revert`, and `clear`. 

```
//reactive get/set

//atomically listen to multiple parts of the state
State.get({modalState:1, registerFormState:1})

//listen even more specifically, only for the changes you care about.
State.get({'modalState.currentMode':1, 'registerFormState.password':1})

//atomically set multiple parts of the state
State.set({modalState:{currentMode:"drawer"}, 'registerFormState.password':"abc123"})

//memorize and revert the state

// this is the initial form state.
State.memorize({form:{name:"", email:"", password:""}})
//user enters information
State.set({'form.name':"John", 'form.email':"john@doe.com", 'form.password':"abc123"})
//reset the state back to it's initial values when John succeeds.
State.revert({form:1});
//when John fails, only reset the password.
State.revert({'form.password':1})

//clear fields from the state
State.clear({"some.temporary.nested.field":1, form:1})

```

## Tutorial
Your client side application is complex, and has several modals, forms, and other stateful objects that can become messy to work with. 

### Initial State
Below, we will look at an example of an initial state of an application.
```
const initialState = {
  snackbar:{
    open: false, 
    message: ""
  },
  contactForm: {
    email:"", 
    message:"", 
    loading:false
  },
  registerForm: {
    step: 0,
    email: "",
    password:"",
    birthday: null,
    agree:false,
    name: "",
    loading:false
  },
  modal:{
    mode:"closed"
  },
  generalSettingsForm: {
    email: "",
    password:"",
    name:"",
    birthday:null
  },
  profileSettingsForm:{
    username:""
  }
}
```
This application requires modals, a snackbar, a registration form, a contact form, and some settings forms.

### Tell the State Tree to record the Initial state.
```
/* /client/lib/main.js */
import StateTree from "meteor/streemo:meteor-react-state-tree";
export const State = new StateTree(initialState);
```
The StateTree will not only insert the `initialState` into a client-side collection, but also remember it, so that you can easily `revert` back to the `initialState` of any sub-tree whenever you want. Let's see with an example.

Instead of initializing the state all in one place, you may also do it only when you need to:
```
import { State } from "/client/lib/main.js";

const initialRegisterFormState = {
  step: 0,
  email: "",
  password:"",
  birthday: null,
  agree:false,
  name: "",
  loading:false
}
State.memorize(initialRegisterFormState);
export default class RegisterForm extends Component {
  ...
}
```

### Reactively Depending on the StateTree.
```
import React, { Component } from "react";
import { createContainer } from "meteor/react-meteor-data";
import { State } from "/client/lib/main.js";

class RegisterForm extends Component {
  onNameInputChange(e){
    const name = e.target.value;
    const allCapsName = name.toUpperCase();
    //add a new field to the state, whenever you want. Will not be memorized.
    State.set({'registerForm.aNewFieldNotInTheInitialSeed':allCapsName})
    //update only the name
    //will not trigger other dependents of other parts of the state to get rerun.
    State.set({'registerForm.name':name})
  }
  componentWillMount(){
    //
    State.memorize({registerForm:{firstTime:new Date()}})
  }
  componentWillUnmount(){
    //get rid of this ephemeral state.
    State.clear({'registerForm.aNewFieldNotInTheInitialSeed':1})
  }
  onSubmit(){
    ...
    if (success){
      //success! reset the registerForm state back to it's initial seed values.
      State.revert({registerForm:1})
    } else {
      //failed! only reset the password field.
      State.revert({'registerForm.password':1})
    }
  }
  render(){
    ...
  }
}

export default createContainer((props)=>{
  //depend only on the registerForm State. 
  //Will not reactively depend on other parts of state
  return {
    form: State.get({registerForm:1})
  }
},RegisterForm)

```

### Reverting Memorized State
In order for the memorization of initial state to work properly, you must only enter nested trees into the `State.memorize` function. For example, instead of entering: `{'some.initial.state':'hello', 'some.other':"goodbye"}`, you would enter: `{some:{initial:{state:"hello"}, other:"goodbye"}}`. This is so that when you want to `revert` the state, you can `revert` subections: `State.revert({'some.initial':1})` That command will not revert the `other: "goodbye"` part of the state.

### Getting and Setting State

```
//equivalent will only reactively depend on the 'some.nested.field.is' field.
State.get({'some.nested':{field:{is:1}}})
State.get({'some.nested.field.is':1`})

//equivalent, will reactively depend on three fields.
State.get({some:{a:1,b:1,d:1}})
State.get({'some.a':1,'some.b':1,'some.d':1})

//this requires that 'the.answer' is already a set object.
//it will leave all other fields except 'is' untouched.
State.set({'the.answer.is':42})

//NOT THE SAME AS THE ABOVE.
//'the.answer' does not need to exist.
//will set 'the.answer' to exactly `{is: 42}`.
//if other fields existed, they will be gone. 
State.set({'the.answer':{is:42}})

//If 'the.answer' was memorized,
//you can re-acquire it by using `State.revert({'the.answer':1})`.
```

### Atomicity
```
//should write to the state atomically.
State.set({'modal.mode':"drawer", 'registerForm.password':"terriblepassword123"})

//Should ONLY be called once when both are changed at the same time.
//This may be called if other fields changed, too, since we are not explicitly 
//only depending on 'modal.mode' and 'registerForm.password'
State.get({modal:1, registerForm:1});

//This will ONLY be called once when both are changed at the same time.
//This will ONLY change if those fields change, since they are only OBSERVING those fields.
State.get({'modal.mode':1, 'registerForm.password':1})
```