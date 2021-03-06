var OrbitControls = function(params){
  this.isControl = true;
  this.lookPosition = (!(typeof params.lookPosition == UNDEFINED))? new THREE.Vector3(params.lookPosition.x, params.lookPosition.y, params.lookPosition.z): new THREE.Vector3(0, 0, 0);
  this.maxRadius = (!(typeof params.maxRadius == UNDEFINED))? params.maxRadius: 150;
  this.minRadius = (!(typeof params.minRadius == UNDEFINED))? params.minRadius: 50;
  this.zoomDelta = (!(typeof params.zoomDelta == UNDEFINED))? params.zoomDelta: 1;
  this.mouseWheelRotationSpeed = (!(typeof params.mouseWheelRotationSpeed == UNDEFINED))? params.mouseWheelRotationSpeed: 3;
  this.mouseWheelZoomSpeed = (!(typeof params.mouseWheelZoomSpeed == UNDEFINED))? params.mouseWheelZoomSpeed: 3;
  this.mouseDragRotationSpeed = (!(typeof params.mouseDragRotationSpeed == UNDEFINED))? params.mouseDragRotationSpeed: 20;
  this.fingerSwipeRotationSpeed = (!(typeof params.fingerSwipeRotationSpeed == UNDEFINED))? params.fingerSwipeRotationSpeed: 20;
  this.keyboardRotationSpeed = (!(typeof params.keyboardRotationSpeed == UNDEFINED))? params.keyboardRotationSpeed: 10;
  this.requestFullScreen = (!(typeof params.requestFullScreen == UNDEFINED))? params.requestFullScreen: false;
  this.initialRadius = (!(typeof params.initialRadius == UNDEFINED))? params.initialRadius: this.maxRadius;
  this.initialPhi = (!(typeof params.initialPhi == UNDEFINED))? params.initialPhi: Math.PI/4;
  this.initialTheta = (!(typeof params.initialTheta == UNDEFINED))? params.initialTheta: Math.PI/4;

  this.multiPivotModelInstance = params.multiPivotModelInstance;

  this.onUpdateCallback = params.onUpdate;

  if (this.initialRadius > this.maxRadius){
    this.initialRadius = this.maxRadius;
  }
  if (this.initialRadius < this.minRadius){
    this.initialRadius = this.minRadius;
  }

  this.keyboardActions = [
    {key: "Right", action: this.rotateAroundYNegativeKeyboard},
    {key: "D", action: this.rotateAroundYNegativeKeyboard},
    {key: "Left", action: this.rotateAroundYPositiveKeyboard},
    {key: "A", action: this.rotateAroundYPositiveKeyboard},
    {key: "Q", action: this.rotateAroundYPositiveKeyboard},
    {key: "W", action: this.zoomIn},
    {key: "Up", action: this.zoomIn},
    {key: "Z", action: this.zoomIn},
    {key: "S", action: this.zoomOut},
    {key: "Down", action: this.zoomOut}
  ];
}

OrbitControls.prototype.onMouseMove = noop;
OrbitControls.prototype.onMouseDown = noop;
OrbitControls.prototype.onMouseUp = noop;
OrbitControls.prototype.onTap = noop;
OrbitControls.prototype.onClick = noop;
OrbitControls.prototype.onTouchStart = noop;
OrbitControls.prototype.onTouchMove = noop;
OrbitControls.prototype.onTouchEnd = noop;
OrbitControls.prototype.onKeyDown = noop;
OrbitControls.prototype.onKeyUp = noop;
OrbitControls.prototype.onResize = noop;

OrbitControls.prototype.onDeactivated = function(){
  if (this.doubleClickCallbackID){
    this.multiPivotModelInstance.unlistenDoubleClick(this.doubleClickCallbackID);
  }
}

OrbitControls.prototype.onFullScreenChange = function(isFullScreen){
  if (!isFullScreen && activeControl.requestFullScreen){
    fullScreenRequested = true;
  }
}

OrbitControls.prototype.zoomIn = function(coef){

  coef = coef || 1;

  if (activeControl.zoomedInThisFrame){
    return;
  }
  activeControl.spherical.radius -= activeControl.zoomDelta * coef;
  if (activeControl.spherical.radius < activeControl.minRadius){
    activeControl.spherical.radius = activeControl.minRadius;
  }
  activeControl.zoomedInThisFrame = true;
}

OrbitControls.prototype.zoomOut = function(coef){

  coef = coef || 1;

  if (activeControl.zoomedOutThisFrame){
    return;
  }
  activeControl.spherical.radius += activeControl.zoomDelta * coef;
  if (activeControl.spherical.radius > activeControl.maxRadius){
    activeControl.spherical.radius = activeControl.maxRadius;
  }
  activeControl.zoomedOutThisFrame = true;
}

OrbitControls.prototype.rotateAroundYPositiveKeyboard = function(){
  if (activeControl.rotatedYPositiveThisFrame){
    return;
  }
  activeControl.spherical.theta += activeControl.keyboardRotationSpeed / 1000;
  activeControl.rotatedYPositiveThisFrame = true;
}

OrbitControls.prototype.rotateAroundYNegativeKeyboard = function(){
  if (activeControl.rotatedYNegativeThisFrame){
    return;
  }
  activeControl.spherical.theta -= activeControl.keyboardRotationSpeed / 1000;
  activeControl.rotatedYNegativeThisFrame = true;
}

OrbitControls.prototype.onMouseWheel = function(event){
  var deltaX = event.deltaX / 10000;
  var deltaY = event.deltaY / 10000;

  if (Math.abs(deltaX) > Math.abs(deltaY)){
    var thetaDelta = deltaX * activeControl.mouseWheelRotationSpeed;

    if (thetaDelta > 0.09){
      thetaDelta = 0.09;
    }

    if (thetaDelta < -0.09){
      thetaDelta = -0.09;
    }

    activeControl.spherical.theta += thetaDelta;
  }else{
    if (event.ctrlKey){
      deltaY = -deltaY;
    }

    var zoomDelta = deltaY * activeControl.mouseWheelZoomSpeed;

    var coef = event.ctrlKey? 1500: 100;

    if (zoomDelta > 0.09){
      zoomDelta = 0.09;
    }

    if (zoomDelta < -0.09){
      zoomDelta = -0.09;
    }

    if (deltaY > 0){
      activeControl.zoomIn(zoomDelta * coef);
    }else{
      activeControl.zoomOut(-zoomDelta * coef);
    }
  }
}

OrbitControls.prototype.onDrag = function(x, y, moveX, moveY){
  activeControl.spherical.theta -= (moveX / 10000) * activeControl.mouseDragRotationSpeed;
  activeControl.spherical.phi -= (moveY / 10000) * activeControl.mouseDragRotationSpeed;
}

OrbitControls.prototype.onPinch = function(diff){
  if (diff > 0){
    activeControl.zoomIn();
  }else{
    activeControl.zoomOut();
  }
}

OrbitControls.prototype.onSwipe = function(x, y, diffX, diffY){
  activeControl.spherical.theta -= (diffX / 10000) * activeControl.fingerSwipeRotationSpeed;
  activeControl.spherical.phi -= (diffY / 10000) * activeControl.fingerSwipeRotationSpeed;
}

OrbitControls.prototype.resetStatus = function(){
  this.zoomedInThisFrame = false;
  this.zoomedOutThisFrame = false;
  this.rotatedYNegativeThisFrame = false;
  this.rotatedYPositiveThisFrame = false;
}

OrbitControls.prototype.onActivated = function(){
  camera.position.copy(this.lookPosition);
  this.spherical = new THREE.Spherical(this.initialRadius, this.initialPhi, this.initialTheta);
  this.resetStatus();
  if (this.requestFullScreen){
    fullScreenRequested = true;
  }

  if (this.multiPivotModelInstance){
    this.animationTargetVector = new THREE.Vector3();
    this.animationTargetVector2 = new THREE.Vector3();
    this.lerpAlpha = null;
    this.doubleClickCallbackID = this.multiPivotModelInstance.listenForDoubleClick(function(x, y, z){
      this.animationTargetVector.set(x, y, z);
      this.animationTargetVector2.set(this.minRadius, 0, 0);
      this.lerpAlpha = 0.05;
    }.bind(this));
  }
}

OrbitControls.prototype.update = function(){
  if (this.lerpAlpha && this.lerpAlpha < 1){
    this.lookPosition.lerp(this.animationTargetVector, this.lerpAlpha);
    REUSABLE_VECTOR.set(this.spherical.radius, 0, 0);
    REUSABLE_VECTOR.lerp(this.animationTargetVector2, this.lerpAlpha);
    this.spherical.radius = REUSABLE_VECTOR.x;
    this.lerpAlpha += 0.05;
  }
  if (this.spherical.phi > 2.66){
    this.spherical.phi = 2.66;
  }
  if (this.spherical.phi < 0.41){
    this.spherical.phi = 0.41;
  }
  if (!isMobile){
    for (var i = 0; i<this.keyboardActions.length; i++){
      var curAction = this.keyboardActions[i];
      if (keyboardBuffer[curAction.key]){
        curAction.action();
      }
    }
  }
  camera.position.setFromSpherical(this.spherical);
  camera.position.add(this.lookPosition);
  camera.lookAt(this.lookPosition.x, this.lookPosition.y, this.lookPosition.z);
  this.resetStatus();

  if (this.onUpdateCallback){
    this.onUpdateCallback();
  }
}
