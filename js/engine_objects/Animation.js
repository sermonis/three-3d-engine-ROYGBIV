var Animation = function(name, type, attachedObject, description, rewind, repeat){
  this.name = name;
  this.type = type;
  this.attachedObject = attachedObject;
  this.description = JSON.parse(JSON.stringify(description));
  this.rewind = rewind;
  this.updateFunction = animationHandler.updateFunctionsByType[type];
  this.actionFunction = animationHandler.actionFunctionsByType[description.action];
  this.totalTimeInSeconds = this.description.totalTimeInSeconds;
  this.repeat = repeat;
  this.params = {object: this.attachedObject};
  if (description.action == animationHandler.actionTypes.OBJECT.EMISSIVE_COLOR || description.action == animationHandler.actionTypes.TEXT.TEXT_COLOR || description.action == animationHandler.actionTypes.TEXT.BACKGROUND_COLOR){
    this.changeInValue = 1;
    this.params.targetColor = new THREE.Color(description.targetColor);
    this.params.sourceColor = new THREE.Color();
  }else if (description.action == animationHandler.actionTypes.TEXT.TYPING){
    this.changeInValue = attachedObject.text.length + 1;
    this.params.sourceText = attachedObject.text;
  }else{
    this.changeInValue = this.description.changeInValue;
  }
  animationHandler.assignUUIDToAnimation(this);
  this.savedState = {
    initialValue: 0, tick: 0, increaseTick: false, totalTranslationX: 0, totalTranslationY: 0, totalTranslationZ: 0
  }
  this.isActive = false;
}

Animation.prototype.restore = function(){
  this.initialValue = this.savedState.initialValue;
  this.tick = this.savedState.tick;
  this.increaseTick = this.savedState.increaseTick;
  if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_X){
    this.params.totalTranslationX = this.savedState.totalTranslationX;
    this.attachedObject.mesh.translateX(this.savedState.totalTranslationX);
  }else if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_Y){
    this.params.totalTranslationY = this.savedState.totalTranslationY;
    this.attachedObject.mesh.translateY(this.savedState.totalTranslationY);
  }else if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_Z){
    this.params.totalTranslationZ = this.savedState.totalTranslationZ;
    this.attachedObject.mesh.translateZ(this.savedState.totalTranslationZ);
  }
}

Animation.prototype.saveState = function(){
  this.savedState.initialValue = this.initialValue;
  this.savedState.tick = this.tick;
  this.savedState.increaseTick = this.increaseTick;
  if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_X){
    this.savedState.totalTranslationX = this.params.totalTranslationX;
  }else if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_Y){
    this.savedState.totalTranslationY = this.params.totalTranslationY;
  }else if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_Z){
    this.savedState.totalTranslationZ = this.params.totalTranslationZ;
  }
}

Animation.prototype.isInitialValueAssigned = function(){
  return this.hasInitialValue;
}

Animation.prototype.invalidateInitialValue = function(){
  this.hasInitialValue = false;
  if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_X){
    this.params.totalTranslationX = 0;
  }else if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_Y){
    this.params.totalTranslationY = 0;
  }else if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_Z){
    this.params.totalTranslationZ = 0;
  }
}

Animation.prototype.setFinishCallbackFunction = function(callbackFunction){
  this.finishCallbackFunction = callbackFunction;
}

Animation.prototype.export = function(){
  return {
    name: this.name, type: this.type, description: this.description, rewind: this.rewind, repeat: this.repeat
  };
}

Animation.prototype.onFinished = function(){
  animationHandler.onAnimationFinished(this);
  this.isActive = false;
}

Animation.prototype.onStart = function(initialValue){
  this.initialValue = initialValue;
  this.tick = 0;
  if (this.description.action == animationHandler.actionTypes.OBJECT.EMISSIVE_COLOR){
    this.params.sourceColor.copy(this.attachedObject.getEmissiveColor());
  }else if (this.description.action == animationHandler.actionTypes.TEXT.TEXT_COLOR){
    this.params.sourceColor.copy(this.attachedObject.getColor());
  }else if (this.description.action == animationHandler.actionTypes.TEXT.BACKGROUND_COLOR){
    this.params.sourceColor.copy(this.attachedObject.getBackgroundColor());
  }else if (this.description.action == animationHandler.actionTypes.TEXT.TYPING){
    this.params.sourceText = this.attachedObject.text;
  }else if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_X){
    this.params.totalTranslationX = 0;
  }else if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_Y){
    this.params.totalTranslationY = 0;
  }else if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_Z){
    this.params.totalTranslationZ = 0;
  }
  this.increaseTick = true;
  this.isActive = true;
}

Animation.prototype.onRepeat = function(){
  if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_X){
    this.attachedObject.mesh.translateX(-1 * this.params.totalTranslationX);
    this.params.totalTranslationX = 0;
  }else if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_Y){
    this.attachedObject.mesh.translateY(-1 * this.params.totalTranslationY);
    this.params.totalTranslationY = 0;
  }else if (this.description.action == animationHandler.actionTypes.OBJECT.TRANSLATE_Z){
    this.attachedObject.mesh.translateZ(-1 * this.params.totalTranslationZ);
    this.params.totalTranslationZ = 0;
  }
}

Animation.prototype.update = function(){
  this.params.value = this.updateFunction(this.tick, this.initialValue, this.changeInValue, this.totalTimeInSeconds);
  this.actionFunction(this.params, this.increaseTick);
  if (this.increaseTick){
    this.tick += STEP;
  }else{
    this.tick -= STEP;
  }
  if (this.increaseTick && this.tick > this.totalTimeInSeconds){
    if (this.rewind){
      this.increaseTick = false;
    }else if (!this.repeat){
      this.onFinished();
    }else{
      this.tick = 0;
      if (!this.rewind){
        this.onRepeat();
      }
    }
    if (!this.rewind && this.finishCallbackFunction){
      this.finishCallbackFunction();
    }
  }else if (!this.increaseTick && this.tick <= 0){
    this.increaseTick = true;
    if (!this.repeat){
      this.onFinished();
    }
    if (this.finishCallbackFunction){
      this.finishCallbackFunction();
    }
  }
}