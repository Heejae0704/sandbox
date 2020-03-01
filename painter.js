function createPainter(parent, width, height) {
  var title = elt("h2", null, "Simple Painter");
  var [canvas, ctx] = createCanvas(width, height);
  var toolbar = elt("div", null);
  for (var name in controls) {
    toolbar.appendChild(controls[name](ctx));
  }
  toolbar.style.fontSize = "small";
  toolbar.style.marginBottom = "3px";
  parent.appendChild(elt("div", null, title, toolbar, canvas));
}
function createCanvas(canvasWidth, canvasHeight) {
  var canvas = elt("canvas", { width: canvasWidth, height: canvasHeight });
  var ctx = canvas.getContext("2d");
  canvas.style.border = "1px solid gray";
  canvas.style.cursor = "pointer";
  canvas.addEventListener(
    "mousedown",
    function(e) {
      var event = document.createEvent("HTMLEvents");
      event.initEvent("change", false, true);
      colorInput.dispatchEvent(event);
      paintTools[paintTool](e, ctx);
    },
    false
  );

  canvas.addEventListener(
    "dragover",
    function(e) {
      e.preventDefault();
    },
    false
  );

  canvas.addEventListener("drop", function(e) {
    var files = e.dataTrasfer.files;
    if (files[0].type.substring(0, 6) !== "image/") return;
    loadImageURL(ctx, URL.createObjectURL(files[0]));
    e.preventDefault();
  });
  return [canvas, ctx];
}
function relativePosition(event, element) {
  var rect = element.getBoundingClientRect();
  return {
    x: Math.floor(event.clientX - rect.left),
    y: Math.floor(event.clientY - rect.top)
  };
}

var paintTool;
var paintTools = Object.create(null);
paintTools.brush = function(e, ctx) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  var img = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  var p = relativePosition(e, ctx.canvas);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  setDragListeners(ctx, img, function(q) {
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  });
};

paintTools.line = function(e, ctx) {
  ctx.lineCap = "round";
  var img = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  var p = relativePosition(e, ctx.canvas);
  setDragListeners(ctx, img, function(q) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  });
};

paintTools.circle = function(e, ctx) {
  var img = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  var p = relativePosition(e, ctx.canvas);
  setDragListeners(ctx, img, function(q) {
    var dx = q.x - p.x;
    var dy = q.y - p.x;
    var r = Math.sqrt(dx * dx + dy * dy);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, 2 * Math.PI, false);
    ctx.stroke();
  });
};

paintTools.circleFill = function(e, ctx) {
  var img = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  var p = relativePosition(e, ctx.canvas);
  setDragListeners(ctx, img, function(q) {
    var dx = q.x - p.x;
    var dy = q.y - p.x;
    var r = Math.sqrt(dx * dx + dy * dy);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, 2 * Math.PI, false);
    ctx.fill();
  });
};

function setDragListeners(ctx, img, draw) {
  var mousemoveEventListener = function(e) {
    ctx.putImageData(img, 0, 0);
    draw(relativePosition(e, ctx.canvas));
  };
  document.addEventListener("mousemove", mousemoveEventListener, false);
  document.addEventListener(
    "mouseup",
    function(e) {
      ctx.putImageData(img, 0, 0);
      draw(relativePosition(e, ctx.canvas));
      document.removeEventListener("mousemove", mousemoveEventListener, false);
      document.removeEventListener("mouseup", arguments.callee, false);
    },
    false
  );
}

var controls = Object.create(null);
var colorInput;
controls.painter = function(ctx) {
  var DEFAULT_TOOL = 0;
  var select = elt("select", null);
  var label = elt("label", null, "그리기 도구 : ", select);
  for (var name in paintTools) {
    select.appendChild(elt("option", { value: name }, name));
  }
  select.selectedIndex = DEFAULT_TOOL;
  paintTool = select.children[DEFAULT_TOOL].value;
  select.addEventListener(
    "change",
    function(e) {
      paintTool = this.children[this.selectedIndex].value;
    },
    false
  );
  return label;
};

controls.color = function(ctx) {
  var input = (colorInput = elt("input", { type: "color" }));
  var label = elt("label", null, "색 : ", input);
  input.addEventListener(
    "change",
    function(e) {
      ctx.strokeStyle = this.value;
      ctx.fillStyle = this.value;
    },
    false
  );
  return label;
};

controls.brushsize = function(ctx) {
  var size = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 28];
  var select = elt("select", null);
  for (var i = 0; i < size.length; i++) {
    select.appendChild(
      elt("option", { value: size[i].toString() }, size[i].toString())
    );
  }
  select.selectedIndex = 2;
  ctx.lineWidth = size[select.selectedIndex];
  var label = elt("label", null, " 선의 너비 : ", select);
  select.addEventListener(
    "change",
    function(e) {
      ctx.lineWidth = this.value;
    },
    false
  );
  return label;
};

controls.alpha = function(ctx) {
  var input = elt("input", {
    type: "number",
    min: "0",
    max: "1",
    step: "0.05",
    value: "1"
  });
  var label = elt("label", null, " 투명도 : ", input);
  input.addEventListener(
    "change",
    function(e) {
      ctx.globalAlpha = this.value;
    },
    false
  );
  return label;
};

controls.save = function(ctx) {
  var input = elt("input", { type: "button", value: "저장" });
  var label = elt("label", null, " ", input);
  input.addEventListener(
    "click",
    function(e) {
      var dataURL = ctx.canvas.toDataURL();
      open(dataURL, "save");
    },
    false
  );
  return label;
};

var filterTools = Object.create(null);
controls.filter = function(ctx) {
  var DEFAULT_FILTER = 0;
  var select = elt("select", null);
  var label = elt("label", null, " ", select);
  select.appendChild(elt("option", { value: "filter" }, "필터"));
  for (var name in filterTools) {
    select.appendChild(elt("option", { value: name }, name));
  }
  select.selectedIndex = DEFAULT_FILTER;
  select.addEventListener(
    "change",
    function(e) {
      var filterTool = this.children[this.selectedIndex].value;
      var inputImage = ctx.getImageData(
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
      );
      var outputImage = filterTools[filterTool](inputImage);
      ctx.putImageData(outputImage, 0, 0);
      select.selectedIndex = DEFAULT_FILTER;
    },
    false
  );
  return label;
};

function weightedAverageFilter(image, n, Weight, keepBrightness, offset) {
  var width = image.width,
    height = image.height;
  var outputImage = new ImageData(width, height);
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      var iR = 4 * (width * y + x);
      for (var i = 0; i < 3; i++) {
        var average = 0,
          weightSum = 0;
        for (ix = -n; ix <= n; ix++) {
          var xp = x + ix;
          if (xp < 0 || xp >= width) continue;
          for (iy = -n; iy <= n; iy++) {
            var yp = y + iy;
            if (yp < 0 || yp >= height) continue;
            var w = Weight[iy + n][ix + n];
            weightSum += w;
            average += w * image.data[4 * (width * yp + xp) + i];
          }
        }
        if (keepBrightness) {
          average /= weightSum;
        }
        outputImage.data[iR + i] = average + offset;
      }
      outputImage.data[iR + 3] = image.data[iR + 3];
    }
  }
  return outputImage;
}

// * 블러 필터
filterTools.blur = function(inputImage) {
  var size = 2;
  var W = [];
  for (var i = 0; i <= 2 * size; i++) {
    W[i] = [];
    for (var j = 0; j <= 2 * size; j++) {
      W[i][j] = 1;
    }
  }
  return weightedAverageFilter(inputImage, size, W, true, 0);
};
// * 샤프 필터
filterTools.sharp = function(inputImage) {
  var W = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ];
  return weightedAverageFilter(inputImage, 1, W, false, 0);
};
// * 엠보싱 필터
filterTools.emboss = function(inputImage) {
  var W = [
    [-1, 0, 0],
    [0, 0, 0],
    [0, 0, 1]
  ];
  return weightedAverageFilter(inputImage, 1, W, false, 128);
};
// * 테두리 강조
filterTools.edgeDetection = function(inputImage) {
  var W = [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1]
  ];
  return weightedAverageFilter(inputImage, 1, W, false, 0);
};

controls.file = function(ctx) {
  var input = elt("input", { type: "file" });
  var label = elt("label", null, " ", input);
  input.addEventListener(
    "change",
    function(e) {
      if (input.files.length == 0) return;
      var reader = new FileReader();
      reader.onload = function() {
        loadImageURL(ctx, reader.result);
      };
      reader.readAsDataURL(input.files[0]);
    },
    false
  );
  return label;
};

function loadImageURL(ctx, url) {
  var image = document.createElement("img");
  image.onload = function() {
    var factor = Math.min(
      ctx.canvas.width / this.width,
      ctx.canvas.height / this.height
    );
    var wshift = (ctx.canvas.width - factor * this.width) / 2;
    var hshift = (ctx.canvas.height - factor * this.height) / 2;
    var savedColor = ctx.fillStyle;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(
      image,
      0,
      0,
      this.width,
      this.height,
      wshift,
      hshift,
      this.width * factor,
      this.height * factor
    );
    ctx.fillStyle = savedColor;
  };
  image.src = url;
}
