const bridge = {
    debug: {
        logLevel: 0,
        info: function () {
            if ( bridge.debug.logLevel > 3 ) {
                console.info.apply( this, arguments );
            }
        },
        debug: function () {
            if ( bridge.debug.logLevel > 4 ) {
                console.debug.apply( this, arguments );
            }
        },
        error: function () {
            console.error.apply( this, arguments );
        },
        warn: function () {
            console.warn.apply( this, arguments );
        }
    },
    util: {
        showSpinner: function ( pObj ) {
            /* define loader */
            var faLoader = $( "<div></div>" );
            faLoader.attr( "id", "loader" + $( pObj ).attr( "id" ) );
            faLoader.addClass( "ct-loader" );
            faLoader.css( "display", "block" );
            faLoader.css( "margin", "0 auto" );
            faLoader.css( "text-align", "center" );
            faLoader.css( "padding", "10px" );
            faLoader.css( "position", "absolute" );
            faLoader.css( "top", "calc(50% - 42px)" );
            faLoader.css( "left", "calc(50% - 42px)" );

            var faLoaderSpan = $( "<span></span>" );
            faLoaderSpan.css( "background", "rgba(121,121,121,0.6)" );
            faLoaderSpan.css( "border-radius", "100%" );
            faLoaderSpan.css( "width", "42px" );
            faLoaderSpan.css( "height", "42px" );
            faLoaderSpan.css( "display", "inline-block" );

            /* define refresh icon with animation */
            var faRefresh = $( "<i></i>" );
            faRefresh.addClass( "fa fa-refresh fa-lg fa-anim-spin" );

            faRefresh.css( "padding", "5px" );
            faRefresh.css( "color", "white" );
            /* append loader */
            faLoader.append( faLoaderSpan );
            faLoaderSpan.append( faRefresh );
            $( pObj ).append( faLoader );
        },
        escapeHTML: function ( str ) {
            str = String( str );
            return str
                .replace( /&/g, "&amp;" )
                .replace( /</g, "&lt;" )
                .replace( />/g, "&gt;" )
                .replace( /"/g, "&quot;" )
                .replace( /'/g, "&#x27;" )
                .replace( /\//g, "&#x2F;" );
        }
    },
    server: {
        plugin: function ( ajaxID, pItems, pOptions ) {
            bridge.debug.debug( {
                "ajaxID": ajaxID,
                "pItems": pItems,
                "pOptions": pOptions
            } );
            ajaxSimulation( ajaxID, pItems, pOptions );
        },
        pluginUrl: function ( ajaxID, pItems ) {
            /* here must the url be returned that make it possible for the plug-in to load images by id that are given by pItems
             ** this feature is used only when use unleash rte plug-in and images should be load by this build feature in other 
             ** frameworks then APEX this make IMHO no sense so this will never be called */
            bridge.debug.debug( {
                "ajaxID": ajaxID,
                "pItems": pItems
            } );
        },
        chunk: function ( pString ) {
            /* apex.server.chunk only avail on APEX 18.2+ */
            var splitSize = 8000;
            var tmpSplit;
            var retArr = [];
            if ( pString.length > splitSize ) {
                for ( retArr = [], tmpSplit = 0; tmpSplit < pString.length; ) {retArr.push( pString.substr( tmpSplit, splitSize ) ), tmpSplit += splitSize;}
                return retArr;
            }
            retArr.push( pString );
            return retArr;
        }
    },
    locale: {
        getLanguage: function () {
            return navigator.language || navigator.userLanguage || en;
        }
    },
    region: {
        create: function() {
            // do nothing
        }
    }
};
