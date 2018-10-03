var MeshGenerator = function(geometry, material){
  this.geometry = geometry;
  this.material = material;
}

MeshGenerator.prototype.generateMesh = function(){
  if (this.material instanceof BasicMaterial){
    return this.generateBasicMesh();
  }
}

MeshGenerator.prototype.generateObjectTrail = function(
  trail, objectCoordinateSize, objectQuaternionSize, posit, quat, objectCoordinates, objectQuaternions){
  var vertexShaderCode = ShaderContent.objectTrailVertexShader.replace(
    "#define OBJECT_COORDINATE_SIZE 1", "#define OBJECT_COORDINATE_SIZE "+objectCoordinateSize
  ).replace(
    "#define OBJECT_QUATERNION_SIZE 1", "#define OBJECT_QUATERNION_SIZE "+objectQuaternionSize
  );
  if (!VERTEX_SHADER_TEXTURE_FETCH_SUPPORTED){
    vertexShaderCode = vertexShaderCode.replace(
      "vec3 objNormal = normalize(normal);", ""
    ).replace(
      "transformedPosition += objNormal * (texture2D(displacementMap, vFaceVertexUV).r * displacementInfo.x + displacementInfo.y);", ""
    );
  }
  var material = new THREE.RawShaderMaterial({
    vertexShader: vertexShaderCode,
    fragmentShader: ShaderContent.objectTrailFragmentShader,
    transparent: true,
    vertexColors: THREE.VertexColors,
    side: THREE.DoubleSide,
    uniforms: {
      projectionMatrix: new THREE.Uniform(new THREE.Matrix4()),
      viewMatrix: new THREE.Uniform(new THREE.Matrix4()),
      objectCoordinates: new THREE.Uniform(objectCoordinates),
      objectQuaternions: new THREE.Uniform(objectQuaternions),
      currentPosition: new THREE.Uniform(posit),
      currentQuaternion: new THREE.Uniform(quat),
      alpha: new THREE.Uniform(trail.alpha),
      diffuseMap: new THREE.Uniform(trail.diffuseTexture),
      emissiveMap: new THREE.Uniform(trail.emissiveTexture),
      alphaMap: new THREE.Uniform(trail.alphaTexture),
      displacementMap: new THREE.Uniform(trail.displacementTexture),
      textureMatrix: new THREE.Uniform(trail.textureMatrix),
      fogInfo: GLOBAL_FOG_UNIFORM
    }
  });
  var mesh = new THREE.Mesh(this.geometry, material);
  return mesh;
}

MeshGenerator.prototype.generateMergedMesh = function(graphicsGroup, objectGroup){
  var diffuseTexture = objectGroup.diffuseTexture;
  var emissiveTexture = objectGroup.emissiveTexture;
  var alphaTexture = objectGroup.alphaTexture;
  var aoTexture = objectGroup.aoTexture;
  var displacementTexture = objectGroup.displacementTexture;
  var textureMatrix = objectGroup.textureMatrix;
  if (!diffuseTexture){
    diffuseTexture = nullTexture;
  }
  if (!emissiveTexture){
    emissiveTexture = nullTexture;
  }
  if (!alphaTexture){
    alphaTexture = nullTexture;
  }
  if (!aoTexture){
    aoTexture = nullTexture;
  }
  if (!displacementTexture){
    displacementTexture = nullTexture;
  }
  if (!textureMatrix){
    textureMatrix = new THREE.Matrix3();
  }

  var vertexShader = ShaderContent.mergedBasicMaterialVertexShader;
  if (!VERTEX_SHADER_TEXTURE_FETCH_SUPPORTED){
    vertexShader = vertexShader.replace(
      "vec3 objNormal = normalize(normal);", ""
    ).replace(
      "transformedPosition += objNormal * (texture2D(displacementMap, vUV).r * displacementInfo.x + displacementInfo.y);", ""
    );
  }

  var material = new THREE.RawShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: ShaderContent.mergedBasicMaterialFragmentShader,
    vertexColors: THREE.VertexColors,
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      projectionMatrix: new THREE.Uniform(new THREE.Matrix4()),
      modelViewMatrix: new THREE.Uniform(new THREE.Matrix4()),
      diffuseMap: new THREE.Uniform(diffuseTexture),
      emissiveMap: new THREE.Uniform(emissiveTexture),
      alphaMap: new THREE.Uniform(alphaTexture),
      aoMap: new THREE.Uniform(aoTexture),
      displacementMap: new THREE.Uniform(displacementTexture),
      textureMatrix: new THREE.Uniform(textureMatrix),
      fogInfo: GLOBAL_FOG_UNIFORM
    }
  });
  var mesh = new THREE.Mesh(this.geometry, material);
  mesh.position.copy(graphicsGroup.position);
  material.uniforms.projectionMatrix.value = camera.projectionMatrix;
  material.uniforms.modelViewMatrix.value = mesh.modelViewMatrix;
  return mesh;
}

MeshGenerator.prototype.generateBasicMesh = function(){
  // diffuse - alpha - ao - displacement
  var textureFlags = new THREE.Vector4(-10, -10, -10, -10);
  // emissive - XX - XX - XX
  var textureFlags2 = new THREE.Vector4(-10, -10, -10, -10);
  var vertexShader = ShaderContent.basicMaterialVertexShader;
  if (!VERTEX_SHADER_TEXTURE_FETCH_SUPPORTED){
    vertexShader = vertexShader.replace(
      "vec3 objNormal = normalize(normal);", ""
    ).replace(
      "transformedPosition += objNormal * (texture2D(displacementMap, vUV).r * displacementInfo.x + displacementInfo.y);", ""
    );
  }
  var material = new THREE.RawShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: ShaderContent.basicMaterialFragmentShader,
    vertexColors: THREE.VertexColors,
    transparent: true,
    side: THREE.DoubleSide,
    uniforms:{
      projectionMatrix: new THREE.Uniform(new THREE.Matrix4()),
      modelViewMatrix: new THREE.Uniform(new THREE.Matrix4()),
      color: new THREE.Uniform(this.material.color),
      alpha: new THREE.Uniform(this.material.alpha),
      fogInfo: GLOBAL_FOG_UNIFORM,
      aoIntensity: new THREE.Uniform(this.material.aoMapIntensity),
      emissiveIntensity: new THREE.Uniform(this.material.emissiveIntensity),
      displacementInfo: new THREE.Uniform(new THREE.Vector2()),
      textureFlags: new THREE.Uniform(textureFlags),
      textureFlags2: new THREE.Uniform(textureFlags2),
      diffuseMap: new THREE.Uniform(nullTexture),
      alphaMap: new THREE.Uniform(nullTexture),
      aoMap: new THREE.Uniform(nullTexture),
      displacementMap: new THREE.Uniform(nullTexture),
      emissiveMap: new THREE.Uniform(nullTexture),
      textureMatrix: new THREE.Uniform(new THREE.Matrix3())
    }
  });
  var mesh = new THREE.Mesh(this.geometry, material);
  material.uniforms.modelViewMatrix.value = mesh.modelViewMatrix;
  material.uniforms.projectionMatrix.value = camera.projectionMatrix;
  return mesh;
}