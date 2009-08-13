/*
 * Copyright (c) 2009, Matt Snider, LLC All rights reserved.
 * Version: 1.0.06
 */

/**
 * Extending YAHOO.util.Dom.
 * @class Dom
 * @namespace YAHOO.util
 * @static
 */
(function() {
    var _DOC = document,
        _YD = YAHOO.util.Dom,
        _YE = YAHOO.util.Event,
        _YL = YAHOO.lang;

    if (! _YD) {_YL.throwError.call(this, _YL.ERROR_NOT_DEFINED, 'YAHOO.util.Dom', 'extend', 'yahoo-ext/dom.js');}
		
	var $ = _YD.get,
        _scrollIntervalId = 0;

    C.HTML.CLS.IS_DELETING = 'isDeleting';

    /*
	 * W3C DOM Level 2 standard node types; for older browsers and IE.
	 */
	if (! _DOC.ELEMENT_NODE) {
		YL.augmentObject(_DOC, {
			ELEMENT_NODE: 1,
			ATTRIBUTE_NODE: 2,
			TEXT_NODE: 3,
			CDATA_SECTION_NODE: 4,
			ENTITY_REFERENCE_NODE: 5,
			ENTITY_NODE: 6,
			PROCESSING_INSTRUCTION_NODE: 7,
			COMMENT_NODE: 8,
			DOCUMENT_NODE: 9,
			DOCUMENT_TYPE_NODE: 10,
			DOCUMENT_FRAGMENT_NODE: 11,
			NOTATION_NODE: 12
		});
	}

    var _throwNotImplemented = _YL.throwError ? function() {
		_YL.throwError.call(this, _YL.ERROR_NOT_IMPLEMENTED, 'YAHOO.util.Dom', arguments);
	}: function(text) {throw(text);};

    var _that = {

        /* defined below */
        animate: function() {_throwNotImplemented('animate', 'yahoo/animation.js');},

        /**
         * Removes whitespace-only text node children.
         * @method cleanWhitespace
         * @param elem {String|Element} Required. Pointer or string reference to DOM element to evaluate.
         * @return {Element} Cleaned DOM node for convenience or NULL.
         * @static
         */
        cleanWhitespace: function(elem) {
            var node = $(elem);
            if (! node) {return null;}
            var cld = node.firstChild;

            while (cld) {
                var nextNode = cld.nextSibling;
                
                if (_DOC.COMMENT_NODE === cld.nodeType || (_DOC.TEXT_NODE === cld.nodeType && ! /\S/.test(cld.nodeValue))) {
                    node.removeChild(cld);
                }

                cld = nextNode;
            }

            return node;
        },

        /**
         * Positions the second element at the same coords as the first.
         * @method cloneDimensions
         * @param srcElem {Element|String} Required. The element to get position of.
         * @param applyElem {Element|String} Required. The element to set position of.
         * @static
         */
        cloneDimensions: function(srcElem, applyElem) {
            var o = _YD.getRegion(srcElem),
                node = $(applyElem);

            if (_YL.isUndefined(o.height)) { // for YUI < 2.7
                o.height = o.bottom - o.top;
                o.width = o.right - o.left;
            }

            _YD.setStyle(node, 'left', o.left + 'px');
            _YD.setStyle(node, 'top', o.top + 'px');
            _YD.setStyle(node, 'height', o.height + 'px');
            _YD.setStyle(node, 'width', o.width + 'px');

            // debugging tools
            // _YD.setStyle(node, 'border', 'red solid 1px');
    		// alert(node.id + 'left: ' + o.left + ', top: ' + o.top + ', height: ' + o.height + ', width: ' + o.width);
        },

        /**
         * If possible creates the document element according to the xhtml namespace, otherwise, normally;
         *  failure returns a Function that throws an exception.
         * @method createNode
         * @param tagName {String} Required. Tag name to create.
         * @return {Element} The newly created element.
         * @static
         */
        createNode: function(tagName) {
            if (_DOC.createElementNS) {
                _YD.createNode = function(tagName) {
                    return tagName ? _DOC.createElementNS('http://www.w3.org/1999/xhtml', tagName) : null;
                };
            }
            else if (_DOC.createElement) {
                _YD.createNode = function(tagName) {
                    return tagName ? _DOC.createElement(tagName) : null;
                };
            }
            else {
                _YD.createNode = function() {throw 'createElement is not available.';};
            }

            return _YD.createNode(tagName);
        },

        /* defined below */
        createTag: function() {_throwNotImplemented('createTag', 'yahoo.ext/lang.js');},

        /**
         * Removes a node from the DOM, using a fading animation and clearning all events.
         * @method deleteNode
         * @param elem {String|Element} Required. Pointer or string reference to DOM element to delete.
         * @param func {Function} Optional. The callback function after animation finishes; default is undefined.
         * @param isRemoveListener {Boolean} Optional. True, when you want to purge event listeners from node and children; default is undefined.
         * @param isAnimate {Boolean} Optional. Animated this action.
         * @return {Boolean} Node deleted.
         * @static
         */
        deleteNode: function(elem, func, isRemoveListener, isAnimate) {
            var node = $(elem),
                fn = _YL.isFunction(func) ? func : function() {};
            if (! node || _YD.hasClass(node, C.HTML.CLS.IS_DELETING)) {return false;}
            var parent = node.parentNode;

            // remove listeners when YAHOO.util.Event is available, but not required
            if (isRemoveListener && _YE && _YE.purgeElement) {_YE.purgeElement(node);}

            // animate when YAHOO.util.Anim  is available, but not required
            if (YAHOO.util.Anim && isAnimate) {
                _YD.addClass(node, C.HTML.CLS.IS_DELETING);
                _YD.animate(node, {opacity: {from: 1, to: 0.25}}, 0.5, YAHOO.util.Easing.easeOut, [{id: 'onComplete', fx: function() {
                    parent.removeChild(node);
                    _YD.addClass(node, C.HTML.CLS.IS_DELETING);
                    if (fn) {fn(parent);}
                }}]);
            }
            else {
                parent.removeChild(node);
                fn(parent);
            }

            return true;
        },

        /**
         * Navigates on the element through native JavaScript properties or YUI equivalent, as provided by instructions.
         * @method exec
         * @param elem {String|Element} Required. Pointer or string reference to DOM element to search from.
         * @param instructions (String} Required. The '.' delimited navigation instructions.
         * @return {Element} The found node or NULL.
         * @static
         */
        exec: function(elem, instructions) {
            var node = $(elem);

            if (! (node && instructions)) {return null;}

            var _s = instructions.split('.');

            for (var i = 0; i < _s.length; i += 1) {
                if (node) {
                    var task = _s[i];

                    if (_YD[task]) {
                        node = _YD[task](node);
                    } // todo: support childNodes[]
                    else if (node[task]) {
                        node = node[task];
                    }
                    else {
                        // unsupported technique
                    }
                }
                else {
                    return true;
                }
            }

            return node;
        },

        /**
         * Find and replace the first text (ignores whitespaces), or append a textnode when there is no textnode.
         * @method findFirstText
         * @param elem {String|Element} Required. Pointer or string reference to DOM element to search.
         * @return {Element} The first available text node or null.
         * @static
         */
        findFirstText: function(elem) {
			var node = $(elem);
			if (! node) {return null;}

            // this is a text node and not a whitespace, so update it
            if (_YD.isTextNode(node) && ('' === node.nodeValue || /\S/.test(node.nodeValue))) {
				return node;
			}
			// find text node
			else {
                var firstText = null,
                    nextSibling = node.firstChild;

                // iterate until nextSibling is null or set to false, indicating we have found a matching node
                while (! firstText && nextSibling) {
                    firstText = _YD.findFirstText(nextSibling);
                    nextSibling = nextSibling.nextSibling;
                }

                return firstText;
			}
        },

        /**
         * Animates the background color of the element with a color flash.
         * @method flashBackgroundColor
         * @param node {Element} Required. Pointer or string reference to DOM element to animate.
         * @param color {String} Required. The color to animate to.
         * @static
         */
        flashBackgroundColor: function(node, color) {
            if (! (node || color)) {return;}

            var attr = {backgroundColor: {to: color}},
                anim = new YAHOO.util.ColorAnim(node, attr),
                oColor = _YD.getBackgroundColor(node);

            anim.onComplete.subscribe(function() {
                setTimeout(function() {
                    var attr = {backgroundColor: {to: oColor}},
                        anim = new YAHOO.util.ColorAnim(node, attr);

                    anim.animate();
                }, 500);
            });

            anim.animate();
        },

        /**
         * Determines the background color of an element in Hexidecimal format, will head up the document stack, if transparent.
         * @method getBackgroundColor
         * @param node {Element} Required. Pointer or string reference to DOM element to evaluate.
         * @return {String} The background color.
         * @static
         */
        getBackgroundColor: function(node) {
            if (! node) {return null;}
            var backgroundColor = _YD.getStyle(node, 'backgroundColor');
            if ('transparent' === backgroundColor) {return _YD.getBackgroundColor(node.parentNode);}
            var rgb = backgroundColor.replace(/rgba?\((.*?)\)/, '$1').split(', ');
            return String.RGBtoHex(rgb[0], rgb[1], rgb[2]);
        },

        /**
         * Retrieves the HTMLBodyElement, x-browser safe.
         * @method getBodyElement
         * @param newDoc {Document} Optional. The document to use.
         * @return {Element} Body DOM node for convenience or NULL.
         * @static
         */
        getBodyElement: function(newDoc) {
            var body;

            if (! newDoc || newDoc === _DOC) {body = $(C.HTML.ID.BODY);} // get body by the ID

            if (! body) { // find the body the tag
                var doc = newDoc || _DOC;
                body = doc.getElementsByTagName('body')[0];

                if (! body) { // try find the body on the document
                    //noinspection XHTMLIncompatabilitiesJS
                    body = doc.body || doc.childNodes[0].childNodes[1];

                    if (! body) { // No body, try appending to document
                        body = doc;
                    }
                }
            }

            return body;
        },

        /**
         * Fetchs the childNode of the node, whilst ignoring whitespaces.
         * @method getChildNode
         * @param elem {String|Element} Required. Pointer or string reference to DOM element to search.
         * @param i {Number} Required. The index of the node to get;
         * @return {Element} The pointer to the found DOM node or NULL.
         * @static
         */
        getChildNode: function(elem, i) {
            var j = 0,
                node = $(elem);

            if (! node) {return null;}

            return _YD.getFirstChildBy(node, function() {
                if (i === j) {return true;}
                j += 1;
            });
        },

        /**
         * Find the common ancestor shared by two elements, or NULL otherwise.
         * @method getCommonAncestor
         * @param elem1 {Element} Required. Pointer or string reference to DOM element to search.
         * @param elem1 {Element} Required. Pointer or string reference to DOM element to search.
         * @return {Element} The desired node or null.
         * @static
         */
        getCommonAncestor: function(elem1, elem2) {
            var node1 = $(elem1),
                node2 = $(elem2);

            if (! (node1 && node2)) {return null;} // missing parameter, fail
            node1 = node1.parentNode;

            // iterate up the DOM tree
            while (node1) {
                if (_YD.isAncestor(node1, node2)) {return node1;}
                node1 = node1.parentNode;
            }

            return null;
        },

        /* defined below */
		getContentAsFloat: function() {_throwNotImplemented('getContentAsFloat', 'yahoo.ext/lang.js');},

        /* defined below */
		getContentAsInteger: function() {_throwNotImplemented('getContentAsInteger', 'yahoo.ext/lang.js');},

        /* defined below */
		getContentAsString: function() {_throwNotImplemented('getContentAsString', 'yahoo.ext/lang.js');},

        /**
         * Returns the left and top scroll value of the document.
         * @method getDocumentScroll
         * @param doc {HTMLDocument} Optional. The document to evaluate.
         * @return {Object} An object where left/top (Number) are the values the document is scrolled to.
         * @static
         */
        getDocumentScroll: function(doc) {
            return {left: _YD.getDocumentScrollLeft(doc), top: _YD.getDocumentScrollTop(doc)};
        },

        /**
         * Returns the height and width of the document.
         * @method getDocumentSize
         * @param doc {HTMLDocument} Optional. The document to evaluate.
         * @return {Object} An object where height/width (Number) are the actual height/width of document (which includes the body and its margin).
         * @static
         */
        getDocumentSize: function(doc) {
            return {height: _YD.getDocumentHeight(doc), width: _YD.getDocumentWidth(doc)};
        },

        /* defined below */
		getElementsByTagName: function() {_throwNotImplemented('getElementsByTagName', 'native.ext/array.js');},

		/**
		 * Returns the first childnode of the node with tag name and class name.
		 * @method getFirstChildByTagAndClass
		 * @param elem {String|Element} Required. Pointer or string reference to DOM element to search.
		 * @param tagName {String} Optional. The DOM node tag name to limit by.
		 * @param className {String} Optional. The DOM node attribute class name to limit by.
		 * @return {Element} The first matching element or null.
		 * @static
		 */
		getFirstChildByTagAndClass: function(elem, tagName, className) {
			var node = $(elem);

			if (! (node && _YL.isString(tagName) && _YL.isString(className))) {return null;}

			return _YD.getFirstChildBy(node, function(node) {
				var tn = _YD.getTagName(node);
				return (tn === tagName && _YD.hasClass(node, className));
			});
		},

        /**
         * Retrieves the first text nodes value.
         * @method getFirstText
         * @param elem {String|Element} Required. Pointer or string reference to DOM element to search.
         * @return {String} The value of the first text node.
         * @static
         */
        getFirstText: function(elem) {
            var node = _YD.findFirstText(elem);
            if (! node) {return '';}
            return _YD.isTextNode(node) ? node.nodeValue : '';
        },

		/**
		 * Returns an image object with src, useful for image caching.
		 * @method getImage
		 * @param src {String} Required. The location of the image.
		 * @return {Image} A Javascript Image Object with the src set.
		 * @static
		 */
		getImage: function(src) {
			var img = new Image();
			img.src = src;
			return img;
		},

		/*
		 * Finds element's absolute position.
		 * @method getPos
		 * @param elem {String|Element} Required. Pointer or string reference to DOM element to evaluate.
		 * @return {Object} The {x:posX, y:posY} of DOM node.
		 * @static
		 *//*
		getPos: function(elem) {
			var node = $(elem),
				curleft = 0, curtop = 0;

			if (node && node.offsetParent) {
				curleft = node.offsetLeft;
				curtop = node.offsetTop;

				while (node.offsetParent) {
					node = node.offsetParent;
					curleft += node.offsetLeft;
					curtop += node.offsetTop;
				}
			}

			return {x:curleft, y:curtop};
		},*/

        /**
         * Safe method for fetching the tagName of a node; also converts to lower-case.
         * @method getTagName
         * @param elem {String|Element} Required. Pointer or string reference to DOM element to evaluate.
         * @return {String} The tagName or an emtpy string.
         * @static
         */
        getTagName: function(elem) {
            var node = $(elem);
            return node ? ('' + node.tagName).toLowerCase() : '';
        },

        /**
         * Finds a node matching the provided criteria, starting at the event target node, then going up the DOM tree; required YAHOO.event.
         * @method getTargetAncestor
         * @param e {Event} Required. The triggered JavaScript event.
		 * @param tagName {String} Optional. The tagName to find.
		 * @param className {String} Optional. The className to find.
         * @return {Element} The desired node or null.
         * @static
         */
		getTargetAncestor: function(e, tagName, className) {
			var node = _YE.getTarget(e),
				nodeTagName;
			
			do {
				nodeTagName = _YD.getTagName(node);
				
				if ((! tagName || nodeTagName === tagName) && (! className || _YD.hasClass(node, className))) {
					return node;
				}
				
				node = node.parentNode;
			}
			while (node);
			
			return null;
		},

        /**
         * Returns the current height and width of the viewport.
         * @method getViewport
         * @return {Object} An object where height/width (Number) are the current viewable area of the page (excludes scrollbars).
         * @static
         */
        getViewport: function(doc) {
            return {height: _YD.getViewportHeight(doc), width: _YD.getViewportWidth(doc)};
        },

        /* defined below */
        hide: function() {_throwNotImplemented('hide', 'yahoo.ext/lang.js');},

		/*
		 * X-browser importNode function to insert.
		 * @method _importNode
		 * @param elem {String|Element} Required. Pointer or string reference to DOM element to activate.
		 * @param allChildren {Boolean} Required. Set to true, when you want to copy the children nodes as well.
		 * @static
		 * @deprecated Note: keeping around, as I might one day want to use it again
		 *
		 * Example:
		 *  var newNode = null, importedNode = null;
		 *
		 *  newNode = xhrResponse.responseXML.getElementsByTagName ('title')[0].childNodes[0];
		 *  if (newNode.nodeType != document.ELEMENT_NODE) {newNode = newNode.nextSibling;}
		 *  if (newNode) {
		 *  importedNode = document._importNode(newNode, true);
		 *  document.getElementById('divTitleContainer').appendChild(importedNode);
		 *  if (!document.importNode) {
		 *     document.getElementById('divTitleContainer').innerHTML = document.getElementById('divTitleContainer').innerHTML;
		 *  }
		 *  }
		 *//*
		_importNode: function(elem, allChildren) {
			var node = YAHOO.util.$(elem);

			switch (node ? null : node.nodeType) {
				case document.ELEMENT_NODE:
					var newNode = document.createElement(node.nodeName);

					// does the node have any attributes to add?
					if (node.attributes && node.getAttribute && newNode.setAttribute && 0 < node.attributes.length) {
						Mint.batch(node.attributes, function(n) {
							if (n && Object.is(n) && node.getAttribute(n.nodeName)) {
								newNode.setAttribute(n.nodeName, node.getAttribute(n.nodeName));
							}
						});
					}

					// are we going after children too, and does the node have any?
					if (allChildren && node.childNodes && 0 < node.childNodes.length) {
						Mint.batch(node.childNodes, function(n) {
							newNode.appendChild(document._importNode(n, allChildren));
						});
					}

					return newNode;

				case document.TEXT_NODE:
				case document.CDATA_SECTION_NODE:
				case document.COMMENT_NODE:
					return document.createTextNode(node.nodeValue);

				default:
					return null;
			}
		},*/

        /**
         * Determines whether an HTMLElement is an ancestor of another HTML element in the DOM hierarchy; this is different from YUI method,
         * because it takes no shortcuts and works right all the time.
         * @method isAncestorOf
         * @param ancestor {String | HTMLElement} Required. The possible ancestor.
         * @param decendant {String | HTMLElement} Required. The possible decendant.
         * @return {Boolean} Is ancestor of decendant.
         * @static
         */
        isAncestorOf: function(ancestor, decendant) {
            var haystack = _YD.get(ancestor),
                needle = _YD.get(decendant);

            if (! (haystack && needle)) {return null;}

            while (needle && needle !== _DOC) {
                if (needle === ancestor) {return true;}
                needle = needle.parentNode;
            }

            return false;
        },

        /* defined below */
        isTagName: function() {_throwNotImplemented('isTagName', 'yahoo.ext/lang.js');},

        /* defined below */
        isElementType: function() {_throwNotImplemented('isElementType', 'yahoo.ext/lang.js');},

        /**
         * Tests if the node is one of 3 text types.
         * @method isTextNode
         * @param elem {String|Element} Required. Pointer or string reference to DOM element to evaluate.
         * @return {Boolean} True, if the elem is a comment, text, or cdata node.
         * @static
         */
        isTextNode: function(elem) {
            var node = $(elem),
                isValidNode = node && node.nodeType; // not calling isNodeOfType because this is faster

            return isValidNode && (node.nodeType === _DOC.CDATA_SECTION_NODE || node.nodeType === _DOC.COMMENT_NODE || node.nodeType === _DOC.TEXT_NODE);
        },

        /**
         * Remove childNodes from node, should be used instead of element.innerHTML = '' as this is xhtml compliant.
         * @method removeChildNodes
         * @param elem {String|Element} Required. Pointer or string reference to DOM element to clear.
         * @return {Number} The number of removed nodes.
         * @static
         */
        removeChildNodes: function(elem) {
            var val = false,
                node = $(elem);

            if (node) {
                val = node.childNodes.length;
                while (node.hasChildNodes()) {
                    node.removeChild(node.firstChild);
                }
            }

            return val;
        },

		/**
		 * Replaces all children of elem as a textnode of text.
		 * @method replace
		 * @param elem {String|Element} Required. Pointer or string reference to DOM element to replace content of.
		 * @param text {String} Required. The innerHTML value equivalent to replace content with.
		 * @static
		 */
		replace: function(elem, text) {
			var node = $(elem);
            if (! node) {return;}
            //noinspection InnerHTMLJS
            node.innerHTML = text;
		},

        /**
         * Scrolls to a given position, animating using a fractal algorithm.
         * @method scrollTo
         * @param x {Number} Required. The x position to scroll to.
         * @param y {Number} Required. The y position to scroll to.
         * @param n {Number} Optional. The number of steps to take; default is 5.
         * @param ms {Number} Optional. The length of time to animate.
         * @param ease {Function} Optional. The easing function.
         * @static
         */
        scrollTo: function(x, y, n, ms, ease) {
            //noinspection UnnecessaryLocalVariableJS
            var offset = _YD.getDocumentScroll(),
                steps = n || 5,
                i = steps,
                time = ms || 250,
                xdiff = x - offset.left,
                ydiff = y - offset.top,
                fx = ease ? ease : function(i) {
                    return Math.pow(2, i); // easing out; fast then slow
                };

            if (offset.left === x && offset.top === y) {return;} // no need to scroll

            clearInterval(_scrollIntervalId);
            _scrollIntervalId = setInterval(function() {
                i -= 1;
                var divisor = fx(i, steps);

                window.scroll(xdiff / divisor + offset.left, ydiff / divisor + offset.top);

                // last step
                if (0 === i) {
                    clearInterval(_scrollIntervalId);
                    window.scroll(x, y);
                }
            }, time / steps);
        },

		/**
		 * Scroll to the top of the page using the native window.scroll method and 0,0 coordinates.
		 * @method scrollTop
		 * @static
		 */
		scrollTop: function() {
			_that.scrollTo(0, 0);
		},

        /**
         * Find and replace the first text, or append a textnode when there is no textnode.
         * @method setFirstText
         * @param elem {String|Element} Required. A pointer or string reference to DOM element to set first text of.
         * @param text {String} Required. The text value to set.
         * @static
         */
        setFirstText: function(elem, text) {
            var node = $(elem);
            if (! node || ! _YL.isDefined(text)) {return;}
            var tn = _YD.findFirstText(node);

            if (tn) {
				tn.nodeValue = text;
			}
			else {
				//noinspection UnusedCatchParameterJS
				try {
					node.appendChild(_DOC.createTextNode(text));
				}
				// appendChild doesn't work with certain elements, like 'var'
				catch (e) {
					_YD.replace(node, text);
				}
			}
        },

        /* defined below */
        show: function() {_throwNotImplemented('show', 'yahoo.ext/lang.js');},

		/**
		 * Toggles the className for the provided element as a result of the boolean.
		 * @method toggleClass
		 * @param elem {String|Element} Required. Pointer or string reference to DOM element apply class to.
		 * @param className {String} Required. The class name to apply.
		 * @param b {Boolean} Optional. Force class instead of toggle.
         * @return {Boolean} The class was added.
		 * @static
		 */
		toggleClass: function(elem, className, b) {
			var bool = _YL.isUndefined(b) ? ! _YD.hasClass(elem, className) : b;
			_YD[bool ? 'addClass' : 'removeClass'](elem, className);
            return bool;
		},

		/**
		 * Hides displayed elements and shows non-displayed element.
		 * @method toggleDisplay
		 * @param elem {String|Element} Required. Pointer or string reference to DOM element to style.
		 * @param b {Boolean} Optional. Force display instead of toggle.
         * @return {Boolean} The class was added.
		 * @static
		 */
		toggleDisplay: function(elem, b) {
			return _YD.toggleClass(elem, C.HTML.CLS.HIDE, _YL.isUndefined(b) ? b : ! b);
		},

		/**
		 * Toggles the visibility of element.
		 * @method visibility
		 * @param elem {String|Element} Required. Pointer or string reference to DOM element to toggle style of.
		 * @param b {Boolean} Optional. Force visible instead of toggle.
         * @return {Boolean} The class was added.
		 * @static
		 */
		toggleVisibility: function(elem, b) {
			return _YD.toggleClass(elem, C.HTML.CLS.HIDDEN, _YL.isUndefined(b) ? b : ! b);
		}
    };

    _YL.augmentObject(_YD, _that);

    // backwards compatibility for 'getRegion', height/width added in YUI 2.7
    var bodyRegion = _YD.getRegion(_YD.getBodyElement());
    if (! bodyRegion.height) {
        _YD.$old_getRegion = _YD.getRegion;
        _YD.getRegion = function() {
            var dim = _YD.$old_getRegion.apply(this, arguments);
            dim.height = dim.bottom - dim.top;
            dim.width = dim.right - dim.left;
            return dim;
        };
    }

    // YAHOO.lang extensions are included
    if (_YL.arrayWalk) {
        var _thatIfLangExtended = {

            /**
             * Creates and returns an html element and adds attributes from the hash.
             * @method createTag
             * @param tagName {String} Required. Tag name to create.
             * @param hash {Object} Optional. The hashtable of attributes, styles, and classes; defaults is empty object.
             * @return {Element} The newly created element; returns null otherwise.
             * @static
             */
            createTag: function(tagName, hash) {
                var node = _YD.createNode(tagName);

                // iterate through the possible attributes
                _YL.forEach(hash || {}, function(v, k) {
                    switch (k.toLowerCase()) {
                        case 'classname':
                        case 'class':
                        case 'cls':
                            _YD.addClass(node, v);
                            break;

                        case 'cellpadding':
                            node.cellPadding = v;
                            break;

                        case 'cellspacing':
                            node.cellSpacing = v;
                            break;

                        case 'colspan':
                            node.colSpan = v;
                            break;

                        case 'src':
                        case 'checked':
                        case 'disabled':
                            // Capitolization is important in your hashtable for these to work properly in all browsers
                            node[k] = v;
                            break;

                        case 'rowspan':
                            node.rowSpan = v;
                            break;

                        case 'style':
                            // iterate on the styles and set them
                            _YL.forEach(v, function(v, k) {
                                _YD.setStyle(node, k, v);
                            });
                            break;

                        case 'innerhtml':
                        case 'text':
                            var text = ('' + v);

                            if (text.match(/<.*?>/) || text.match(/&.*?;/)) {
	                            _YD.replace(node, text);
                            }
                            else {
	                            node.appendChild(_DOC.createTextNode(text));
                            }
                                
                            break;

                        default:
                            node.setAttribute(k, v);
                            break;
                    }
                });

                return node || null;
            },

            /**
             * Returns the elements content as a float.
             * @method getContentAsFloat
             * @param elem {String|Element} Required. Pointer or string reference to DOM element to evaluate.
             * @return {String} The innerHTML of the node as a float.
             * @static
             */
            getContentAsFloat: function(elem) {
                return parseFloat(_YD.getContentAsString(elem));
            },

            /**
             * Returns the elements content as a integer.
             * @method getContentAsInteger
             * @param elem {String|Element} Required. Pointer or string reference to DOM element to evaluate.
             * @return {String} The innerHTML of the node as a integer.
             * @static
             */
            getContentAsInteger: function(elem) {
                return parseInt(_YD.getContentAsString(elem), 10);
            },

            /**
             * Returns the elements content.
             * @method getContentAsString
             * @param elem {String|Element} Required. Pointer or string reference to DOM element to evaluate.
             * @return {String} The innerHTML of the node.
             * @static
             */
            getContentAsString: function(elem) {
                /*
                 * Returns the elements content of nodes as a string.
                 */
                var _getContentAsString = window.XMLSerializer ? function(nodes) { // mozilla
                    var xmlSerializer = new XMLSerializer(),
                        sb = [];

                    _YL.arrayWalk(nodes, function(node, i) {
                        //noinspection NestedConditionalExpressionJS
                        sb[i] = (_DOC.CDATA_SECTION_NODE === node.nodeType) ? node.nodeValue : xmlSerializer.serializeToString(node);
                    });

                    return sb.join('').replace(/(\<textarea[^\<]*?)\/\>/, '$1>&nbsp;</textarea>');
                } : function(nodes) { // IE
                    var sb = [];

                    _YL.arrayWalk(nodes, function(node, i) {
                    //noinspection NestedConditionalExpressionJS,InnerHTMLJS
                        sb[i] = (_YD.isTextNode(node)) ? node.nodeValue : node.xml || node.innerHTML;
                    });

                    return sb.join('').replace(/\/?\>\<\/input\>/gi, '\/>'); // IE tends to insert a bogus "</input>" element instead of understanding empty closure "<input ... />"
                };

                _YD.getContentAsString = function(elem) {
                    var parentNode = _YD.get(elem);

                    if (! parentNode || ! parentNode.childNodes.length) {return '';}

                    if (_YD.isTextNode(parentNode.firstChild) && 1 === parentNode.childNodes.length) {
                        return parentNode.firstChild.nodeValue;
                    }
                    else {
                        return _getContentAsString(parentNode.childNodes);
                    }
                };

                return _YD.getContentAsString(elem);
            },

			/**
			 * Hides any number of elements using class 'hide'; doesn't attempt to correct "display:none", designers should use a class to apply display instead.
			 * @method hide
			 * @param arg1 {String|Element} Required. Pointer or string reference to DOM element to style.
			 * @param argX {String|Element} Optional. Additional pointers or string references to DOM element to style.
			 * @static
			 */
			hide: function(arg1, argX) {
				_YL.arrayWalk(arguments, function(elem) {
					_YD.addClass(elem, C.HTML.CLS.HIDE);
				});
			},

            /**
             * Tests if the node has the same tag name as those included in arguments 2+.
             * @method isTagName
             * @param elem {String|Element} Required. Pointer or string reference to DOM element to evaluate.
             * @param arg1 {String} Required. A node name to compare with.
             * @param argX {String} Optional. Additional node names to compare with.
             * @return {Boolean} True when the DOM node attribute nodeName is included in the arguments.
             * @static
             *
             * Example:
             * isTagName(domNode, 'div', 'input', 'div');
             */
            isTagName: function(elem, arg1, argX) {
                var tagName = _YD.getTagName(elem);                
                if (! tagName) {return false;}

                return _YL.arrayWalk(arguments, function(tagname) {
                    if (tagName === tagname) {return true;}
                });
            },

            /**
             * Tests if the node has the same type as those included in arguments 2+.
             * @method isElementType
             * @param elem {String|Element} Required. Pointer or string reference to DOM element to evaluate.
             * @param arg1 {Number} Required. A node type to compare with.
             * @param argX {Number} Optional. Additional node types to compare with.
             * @return {Boolean} True when the DOM node attribute nodeType is included in the arguments.
             * @static
             *
             * Example:
             * isElementType(domNode, document.ELEMENT_NODE, document.ATTRIBUTE_NODE, document.TEXT_NODE);
             */
            isElementType: function(elem, arg1, argX) {
                var node = $(elem);
                if (! (node && node.nodeType)) {return false;}

                return _YL.arrayWalk(arguments, function(nodetype) {
                    if (node.nodeType === nodetype) {return true;}
                });
            },

			/**
			 * Show any number of elements removing class 'hide'.
			 * @method show
			 * @param arg1 {String|Element} Required. Pointer or string reference to DOM element to style.
			 * @param argX {String|Element} Optional. Additional pointers or string references to DOM element to style.
			 * @static
			 */
			show: function(arg1, argX) {
				_YL.arrayWalk(arguments, function(node) {
					_YD.removeClass(node, C.HTML.CLS.HIDE);
				});
			}
		};
		
		_YL.augmentObject(_YD, _thatIfLangExtended, true);
	}

    // extend helper methods requiring yahoo/animation.js
    if (YAHOO.util.Anim) {
        var _thatIfAnim = {

            /**
             * Removes a node from the DOM, using a fading animation and clearning all events.
             * @method animate
             * @param elem {String|Element} Required. Pointer or string reference to DOM element to delete.
             * @param obj {Object} Optional. The animation object data; default will fade opacity from 1 to 0.25.
             * @param dur {Number} Optional. The duration of the animation; default is 0.5s.
             * @param ease {Object} Optional. The easing method; default is easeOut.
             * @param functions {Array} Optional. A collection of animation event callback functions {id: the event, fx: callback function}.
             * @return {Object} YAHOO animation object.
             * @static
             */
            animate: function(elem, obj, dur, ease, functions) {
                var node = $(elem),
                    cfg = {
                    duration: dur || 0.5,
                    ease: ease || YAHOO.util.Easing.easeOut,
                    obj: obj || {opacity: {from: 1, to: 0.25}}
                },
                    fxs = functions || [],
                    anim = new YAHOO.util.Anim(node, cfg.obj, cfg.duration, cfg.ease);

                // functions are provided
                if (fxs.length) {
                    for (var i = 0; i < fxs.length; i += 1) {
                        var o = fxs[i];
                        if (anim[o.id]) {anim[o.id].subscribe(o.fx);}
                    }
                }

                anim.animate();
                return anim;
            }
        };

        _YL.augmentObject(_YD, _thatIfAnim, true);
    }

    // extend helper methods requiring native-ext/array.js
    var _augmentDomWithArrayMethods = function() {

        var _thatIfArray = {

			/**
			 * Wraps the native getElementsByTagName method, converting the nodelist to an Array object.
			 * @method getElementsByTagName
			 * @param tagName {String} Required. The DOM node tag to search for.
			 * @param elem {String|Element} Required. Pointer or string reference to DOM element to search.
			 * @return {NodeList} The collection of nodes.
			 * @static
			 */
			getElementsByTagName: function(tagName, elem) {
				var node = $(elem);
				if (! node) {return null;}
				return Array.get(node.getElementsByTagName(tagName));
			}
        };

        _YL.augmentObject(_YD, _thatIfArray, true);
    };

    if (Array.get) {
        _augmentDomWithArrayMethods();
    }
    else {
        _YD.augmentWithArrayMethods = function() {
            _augmentDomWithArrayMethods();
            delete _YD.augmentWithArrayMethods;
        };
    }
})();