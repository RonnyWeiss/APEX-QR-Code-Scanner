// eslint-disable-next-line no-unused-vars
const qrCodeScanner = function ( apex, $, Html5Qrcode, Html5QrcodeSupportedFormats ) {
    "use strict";
    var util = {
        "featureDetails": {
            name: "APEX QR Code Scanner",
            info: {
                scriptVersion: "22.12.15",
                utilVersion: "22.11.28",
                url: "https://github.com/RonnyWeiss",
                license: "MIT"
            }
        }
    };

    return {
        initialize: function ( pConfig ) {

            apex.debug.info( {
                "fct": `${util.featureDetails.name} - initialize`,
                "arguments": {
                    "pConfig": pConfig
                },
                "featureDetails": util.featureDetails
            } );

            let html5QrCode,
                bStr,
                container$;
            const region$ = $( "#" + pConfig.regionID );
            const ratio = 1.777778;

            function startScanner() {
                const qrboxFunction = function( viewfinderWidth, viewfinderHeight ) {
                    let minEdgePercentage = 0.7; // 70%
                    let minEdgeSize = Math.min( viewfinderWidth, viewfinderHeight );
                    let qrboxSize = Math.floor( minEdgeSize * minEdgePercentage );
                    return {
                        width: qrboxSize,
                        height: qrboxSize
                    };
                };

                const qrConfig = { fps: 5, qrbox: qrboxFunction };
                html5QrCode.start( { facingMode: pConfig.facingMode }, qrConfig, qrCodeSuccessCallback );
            }

            function init() {
                const containerID = pConfig.regionID + "_scanner";
                container$ = $( "<div>" );
                container$.addClass( "qr-code-scanner-container" );
                container$.css( "height", pConfig.height + "px" );
                container$.css( "width", pConfig.height * ratio + "px" );
                container$.css( "margin", "0 auto" );
                container$.attr( "id", containerID );
                region$.append( container$ );

                if ( pConfig.mirrorCamera ) {
                    container$.css( "transform", "rotateY(180deg)" );
                    container$.css( "-webkit-transform", "rotateY(180deg)o" );
                    container$.css( "-moz-transform", "rotateY(180deg)" );
                }

                const formats = pConfig.scanFormats.split( ":" ).map( str => {
                    return Number( str );
                } );

                html5QrCode = new Html5Qrcode( containerID, { formatsToSupport: formats, aspectRatio: ratio } );
                startScanner();
            }
                  
            const qrCodeSuccessCallback = ( decodedText ) => {              
                if ( bStr !== decodedText ) {
                    switch ( pConfig.resultMode ) {
                    case 1:
                        try {
                            var func = new Function( "scannedValue", pConfig.executeJavaScript );

                            func( decodedText );
                        } catch ( e ) {
                            apex.debug.error( {
                                "fct": util.featureDetails.name + " - qrCodeSuccessCallback",
                                "msg": "Error while execute JavaScript Code!",
                                "err": e,
                                "featureDetails": util.featureDetails
                            } );
                        }
                        break;
                    case 2:
                        try {
                            var value = decodedText;

                            // conver to number when number in correct language string
                            if ( pConfig.numberConversion && value && value.length > 0 && !isNaN( value ) ) {
                                value = parseFloat( value );
                                value = value.toLocaleString( apex.locale.getLanguage(), {
                                    useGrouping: false
                                } );
                            }

                            apex.item( pConfig.setItem ).setValue( value );
                        } catch ( e ) {
                            apex.debug.error( {
                                "fct": util.featureDetails.name + " - qrCodeSuccessCallback",
                                "msg": "Error while try to set APEX Item!",
                                "err": e,
                                "featureDetails": util.featureDetails
                            } );
                        }
                        break;
                    case 3:
                        region$.trigger( 'qr-code-scanned', decodedText );
                        break;
                    default:
                        apex.debug.error( {
                            "fct": util.featureDetails.name + " - qrCodeSuccessCallback",
                            "msg": "SetMode not found!",
                            "featureDetails": util.featureDetails
                        } );
                    }
                    bStr = decodedText;
                }
            };

            function resetValue() {
                bStr = "";
                if ( pConfig.resultMode === 2 ) {
                    apex.item( pConfig.setItem ).setValue( "" );
                }
            }

            apex.region.create(
                pConfig.regionID,
                {                
                    type: util.featureDetails.name,
                    refresh: function(){
                        resetValue();
                    },
                    pause: function() {
                        html5QrCode.stop();
                        resetValue();
                    },
                    start: function() {
                        startScanner();
                    },
                    setFacingMode: function( pFacingMode ){
                        pConfig.facingMode = pFacingMode;
                        html5QrCode.stop();
                        startScanner();
                    }
                }
            );

            // Add control events for compatibility for all users that still uses that.
            region$.on( "scannerPause", function () {
                apex.region( pConfig.regionID ).pause();
            } );

            region$.on( "scannerPlay", function () {
                apex.region( pConfig.regionID ).start();
            } );

            region$.on( "resetValue", function () {
                apex.region( pConfig.regionID ).refresh();
            } );

            init();
        }
    };
};
