/**
 * Utility for Flash version detection
 * @namespace YAHOO.util
 * @module swfdetect
 */
YAHOO.namespace("util");

/**
 * Flafh detection utility.
 * @class SWFDetect
 * @static
 */
(function () {
	
var version = 0;
var uA = YAHOO.env.ua;
var sF = "ShockwaveFlash";

 	if (uA.gecko || uA.webkit || uA.opera) {
		   if ((mF = navigator.mimeTypes['application/x-shockwave-flash'])) {
		      if ((eP = mF.enabledPlugin)) {
				 var vS = [];
		         vS = eP.description.replace(/\s[rd]/g, '.').replace(/[A-Za-z\s]+/g, '').split('.');
		         version = parseFloat(vS[0] + '.' + vS[2]);
		      }
		   }
		}
		else if(uA.ie) {
		    try
		    {
		        var ax6 = new ActiveXObject(sF + "." + sF + ".6");
		        ax6.AllowScriptAccess = "always";
		    }
		    catch(e)
		    {
		        if(ax6 != null)
		        {
		            version = 6.0;
		        }
		    }
		    if (version == 0) {
		    try
		    {
		        var ax  = new ActiveXObject(sF + "." + sF);
		       	var vS = [];
		        vS = ax.GetVariable("$version").replace(/[A-Za-z\s]+/g, '').split(',');
		        version = parseFloat(vS[0] + '.' + vS[2]);
		    } catch (e) {}
		    }
		}
		
		uA.flash = version;
		
YAHOO.util.SWFDetect = {		
		getFlashVersion : function () {
			return version;
		},
		
		isFlashVersionAtLeast : function (ver) {
			return (version >= ver);
		}	
		};
})();

YAHOO.register("swfdetect", YAHOO.util.SWFDetect, {version: "2.7.0", build: "1796"});