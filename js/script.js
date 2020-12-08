var qrCodeScanner = (function () {
    "use strict";
    var util = {
        /**********************************************************************************
         ** required functions 
         *********************************************************************************/
        featureInfo: {
            name: "APEX QR Code Scanner",
            info: {
                scriptVersion: "1.5",
                utilVersion: "1.3.5",
                url: "https://github.com/RonnyWeiss",
                license: "MIT"
            }
        },
        isDefinedAndNotNull: function (pInput) {
            if (typeof pInput !== "undefined" && pInput !== null && pInput != "") {
                return true;
            } else {
                return false;
            }
        },
        isAPEX: function () {
            if (typeof (apex) !== 'undefined') {
                return true;
            } else {
                return false;
            }
        },
        varType: function (pObj) {
            if (typeof pObj === "object") {
                var arrayConstructor = [].constructor;
                var objectConstructor = ({}).constructor;
                if (pObj.constructor === arrayConstructor) {
                    return "array";
                }
                if (pObj.constructor === objectConstructor) {
                    return "json";
                }
            } else {
                return typeof pObj;
            }
        },
        debug: {
            info: function () {
                if (util.isAPEX()) {
                    var i = 0;
                    var arr = [];
                    for (var prop in arguments) {
                        arr[i] = arguments[prop];
                        i++;
                    }
                    arr.push(util.featureInfo);
                    apex.debug.info.apply(this, arr);
                }
            },
            error: function () {
                var i = 0;
                var arr = [];
                for (var prop in arguments) {
                    arr[i] = arguments[prop];
                    i++;
                }
                arr.push(util.featureInfo);
                if (util.isAPEX()) {
                    apex.debug.error.apply(this, arr);
                } else {
                    console.error.apply(this, arr);
                }
            }
        },
        /**********************************************************************************
         ** optinal functions 
         *********************************************************************************/
        loader: {
            start: function (id, setMinHeight) {
                if (setMinHeight) {
                    $(id).css("min-height", "100px");
                }
                if (util.isAPEX()) {
                    apex.util.showSpinner($(id));
                } else {
                    /* define loader */
                    var faLoader = $("<span></span>");
                    faLoader.attr("id", "loader" + id);
                    faLoader.addClass("ct-loader");
                    faLoader.css("text-align", "center");
                    faLoader.css("width", "100%");
                    faLoader.css("display", "block");

                    /* define refresh icon with animation */
                    var faRefresh = $("<i></i>");
                    faRefresh.addClass("fa fa-refresh fa-2x fa-anim-spin");
                    faRefresh.css("background", "rgba(121,121,121,0.6)");
                    faRefresh.css("border-radius", "100%");
                    faRefresh.css("padding", "15px");
                    faRefresh.css("color", "white");

                    /* append loader */
                    faLoader.append(faRefresh);
                    $(id).append(faLoader);
                }
            },
            stop: function (id, removeMinHeight) {
                if (removeMinHeight) {
                    $(id).css("min-height", "");
                }
                $(id + " > .u-Processing").remove();
                $(id + " > .ct-loader").remove();
            }
        },
        jsonSaveExtend: function (srcConfig, targetConfig) {
            var finalConfig = {};
            var tmpJSON = {};
            /* try to parse config json when string or just set */
            if (typeof targetConfig === 'string') {
                try {
                    tmpJSON = JSON.parse(targetConfig);
                } catch (e) {
                    util.debug.error({
                        "msg": "Error while try to parse targetConfig. Please check your Config JSON. Standard Config will be used.",
                        "err": e,
                        "targetConfig": targetConfig
                    });
                }
            } else {
                tmpJSON = $.extend(true, {}, targetConfig);
            }
            /* try to merge with standard if any attribute is missing */
            try {
                finalConfig = $.extend(true, {}, srcConfig, tmpJSON);
            } catch (e) {
                finalConfig = $.extend(true, {}, srcConfig);
                util.debug.error({
                    "msg": "Error while try to merge 2 JSONs into standard JSON if any attribute is missing. Please check your Config JSON. Standard Config will be used.",
                    "err": e,
                    "finalConfig": finalConfig
                });
            }
            return finalConfig;
        }
    };

    return {
        /* Initialize function for cards */
        initialize: function (regionID, configJSON, setMode, executeCode, apexItem, noNumberConvert) {

            util.debug.info({
                "moule": "initialize",
                "regionID": regionID,
                "configJSON": configJSON,
                "setMode": setMode,
                "executeCode": executeCode,
                "apexItem": apexItem
            });

            util.loader.start("#" + regionID, true);

            var defConf = {
                height: 360,
                scanFrameColor: "rgba(192,0,15,1)",
                facingMode: "environment"
            };
            var bStr = "";
            var numberConversion = true;

            if (noNumberConvert === "Y") {
                numberConversion = false;
            }

            var config = util.jsonSaveExtend(defConf, configJSON);
            var bounds;

            /************************************************************************
             **
             ** Used to dom objects
             **
             ***********************************************************************/
            try {
                var video = document.createElement("video");
                $(video).css("position", "absolute");
                $(video).css("top", "0");

                var canvasElement = document.createElement("canvas");
                var canvas = canvasElement.getContext("2d");
                $(canvasElement).css("position", "absolute");
                $(canvasElement).css("top", "0");

                var div = $("<div></div>");
                div.css("display", "block");
                div.css("margin", "5px auto");


                var canvasBuffElement = document.createElement("canvas");
                $(canvasBuffElement).css("display", "none");
                var canvasBuff = canvasBuffElement.getContext("2d");

                /* add video to dom to prevent ios 14 freeze */
                $(div).append(video);
                $(div).append(canvasBuffElement);
                $(div).append(canvasElement);

                $("#" + regionID).append(div);
            } catch (e) {
                util.debug.error({
                    "module": "initialize",
                    "msg": "Error while try to create canvas for video frame",
                    "err": e
                });
            }

            /************************************************************************
             **
             ** Used to frame border around qr code
             **
             ***********************************************************************/
            function drawLine(begin, end, color) {
                canvas.beginPath();
                canvas.moveTo(begin.x, begin.y);
                canvas.lineTo(end.x, end.y);
                canvas.lineWidth = 4;
                canvas.strokeStyle = color;
                canvas.stroke();
            }
            /************************************************************************
             **
             ** Used to load video frame
             **
             ***********************************************************************/
            try {
                navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        facingMode: config.facingMode
                    }
                }).then(function (stream) {
                    video.srcObject = stream;
                    video.setAttribute("autoplay", true);
                    video.setAttribute("muted", true);
                    video.setAttribute("playsinline", true); // required for iOS to prevent fullscreen
                    video.play();
                    requestAnimationFrame(tick);
                });
            } catch (e) {
                util.debug.error({
                    "module": "initialize",
                    "msg": "Your browser does not support video or you do not use HTTPS",
                    "err": e
                });
            }

            /************************************************************************
             **
             ** Used to scan qr code
             **
             ***********************************************************************/
            function tick() {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    // check ratio of video
                    var ratio = (video.videoWidth / video.videoHeight);
                    // workaround for some browser like edge
                    if (isNaN(ratio)) {
                        ratio = (video.width / video.height)
                    }
                    // workaround if no ratio can be calculated
                    if (isNaN(ratio)) {
                        ratio = 4 / 3
                    }

                    util.loader.stop("#" + regionID);

                    canvasElement.height = config.height;
                    canvasElement.width = config.height * ratio;
                    canvasBuffElement.height = config.height;
                    canvasBuffElement.width = config.height * ratio;
                    video.height = config.height;
                    video.width = config.height * ratio;
                    $(div).width(config.height * ratio);
                    $(div).height(config.height);

                    canvasBuff.drawImage(video, 0, 0, Math.floor(canvasElement.width), Math.floor(canvasElement.height));
                    var imageData = canvasBuff.getImageData(0, 0, Math.floor(canvasElement.width), Math.floor(canvasElement.height));
                    try {
                        var code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert",
                        });
                        bounds = code === null ? null : code.location
                    } catch (err) {
                        util.debug({
                            "module": "tick",
                            "msg": "Error while execute jsQR Code!",
                            "err": err
                        });
                    }

                    if (bounds !== null) {
                        drawLine(code.location.topLeftCorner, code.location.topRightCorner, config.scanFrameColor);
                        drawLine(code.location.topRightCorner, code.location.bottomRightCorner, config.scanFrameColor);
                        drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, config.scanFrameColor);
                        drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, config.scanFrameColor);
                        if (bStr.length != code.data.length) {
                            switch (setMode) {
                                case 1:
                                    try {
                                        var func = new Function("scannedValue", executeCode);

                                        func(code.data);
                                    } catch (e) {
                                        util.debug.error({
                                            "module": "tick",
                                            "msg": "Error while execute JavaScript Code!",
                                            "err": e
                                        });
                                    }
                                    break;
                                case 2:
                                    try {
                                        var value = code.data;

                                        // conver to number when number in correct language string
                                        if (numberConversion && value && value.length > 0 && !isNaN(value)) {
                                            value = parseFloat(value);
                                            value = value.toLocaleString(apex.locale.getLanguage(), {
                                                useGrouping: false
                                            });
                                        }

                                        apex.item(apexItem).setValue(value);
                                    } catch (e) {
                                        util.debug.error("Error while try to set APEX Item!");
                                        util.debug.error(e);
                                    }
                                    break;
                                case 3:
                                    $('#' + regionID).trigger('qr-code-scanned', code.data);
                                    break;
                                default:
                                    util.debug.error("SetMode not found!");
                            }
                            bStr = code.data;
                        }
                    } else {
                        canvas.clearRect(0, 0, canvasElement.width, canvasElement.height)
                    }
                }

                /************************************************************************
                 **
                 ** Used to init qr code scan
                 **
                 ***********************************************************************/
                try {
                    requestAnimationFrame(tick);
                } catch (e) {
                    util.debug.error({
                        "module": "initialize",
                        "msg": "Error while try to scan QR Code",
                        "err": e
                    });
                }
            }

            /* Add control events */
            $("#" + regionID).on("scannerPause", function () {
                video.pause();
                if (setMode == 2) {
                    apex.item(apexItem).setValue("");
                }
            });

            $("#" + regionID).on("scannerPlay", function () {
                bStr = "";
                video.play();
            });

            $("#" + regionID).on("resetValue", function () {
                bStr = "";
                if (setMode == 2) {
                    apex.item(apexItem).setValue("");
                }
            });
        }
    }
})();
