import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { proj } from "./utils.js";

export default class State {
  constructor(tree){
    this._store = new Mongo.Collection(null);
    this._store.insert({_id:"state"});
    this.memory = {};
    if (tree){
      this.memorize(tree);
    }
  }
  memorize(tree){
    const p = proj(tree,null,true);
    for (let k in p)
      this.memory[k] = p[k];
    this._store.update("state",{$set:tree});
  }
  revert(tree){
    const reset = {};
    for (let k in proj(tree,1))
      reset[k] = this.memory[k];
    this._store.update('state',{$set:reset});
  }
  clear(tree){
    this._store.update('state',{$unset:proj(tree,"")})
  }
  get(tree){
    return this._store.findOne("state", {fields:proj(tree,1)})
  }
  set(tree){
    try {
      this._store.update("state", {$set:proj(tree)})
    } catch(e){
      throw new Meteor.Error('Invalid Tree',"You may not set keys for non-object values.")
    }
  }
}