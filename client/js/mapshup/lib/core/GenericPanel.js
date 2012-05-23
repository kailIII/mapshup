/*
 * mapshup - Webmapping made easy
 * http://mapshup.info
 *
 * Copyright Jérôme Gasperi, 2011.12.08
 *
 * jerome[dot]gasperi[at]gmail[dot]com
 *
 * This software is a computer program whose purpose is a webmapping application
 * to display and manipulate geographical data.
 *
 * This software is governed by the CeCILL-B license under French law and
 * abiding by the rules of distribution of free software.  You can  use,
 * modify and/ or redistribute the software under the terms of the CeCILL-B
 * license as circulated by CEA, CNRS and INRIA at the following URL
 * "http://www.cecill.info".
 *
 * As a counterpart to the access to the source code and  rights to copy,
 * modify and redistribute granted by the license, users are provided only
 * with a limited warranty  and the software's author,  the holder of the
 * economic rights,  and the successive licensors  have only  limited
 * liability.
 *
 * In this respect, the user's attention is drawn to the risks associated
 * with loading,  using,  modifying and/or developing or reproducing the
 * software by the user in light of its specific status of free software,
 * that may mean  that it is complicated to manipulate,  and  that  also
 * therefore means  that it is reserved for developers  and  experienced
 * professionals having in-depth computer knowledge. Users are therefore
 * encouraged to load and test the software's suitability as regards their
 * requirements in conditions enabling the security of their systems and/or
 * data to be ensured and,  more generally, to use and operate it in the
 * same conditions as regards security.
 *
 * The fact that you are presently reading this means that you have had
 * knowledge of the CeCILL-B license and that you accept its terms.
 */

/**
 * Mapshup Generic Panel
 * 
 * This object should not be instantiates alone
 */
(function (msp) {

    msp.GenericPanel = function (options) {
        
        /*
         * Paranoid mode
         */
        options = options || {};
        
        /*
         * Reference of the active item
         */
        this.active = null;
        
        /*
         * Panel height
         */
        this.h = msp.Util.getPropertyValue(options, "h", 96);
        
        /*
         * List of panel items
         * 
         * The minimal structure of a GenericPanel item
         * should contain the following properties 
         * 
         * {
         *      id: // unique id to identify item
         *      $d: // jquery object of the created item
         *      $tab: // jquery tab object reference
         * }
         */
        this.items = [];
        
        /*
         * If true, the panel is display over the map
         * If false, the panel "push" the map
         */
        this.over = msp.Util.getPropertyValue(options, "over", false);
        
        /*
         * Item container padding
         */
        this.padding = {
            top:5,
            bottom:5
        };
        
        /*
         * Panel position
         */
        this.position = msp.Util.getPropertyValue(options, "position", 'n');
        
        /**
         * Panel initialisation
         */
        this.init = function() {
            
            var self = this;
            
            /*
             * If panel height value is set to -1 then the panel height
             * is automatically computed from window.height with a minimum value of 300px
             */
            if (self.h === -1) {
                self.h = Math.max(Math.round(2 * msp.$map.height() / 5), 300);
            }
            
            /*
             * Create a Panel div within msp.$container
             * 
             * <div id="..." class="pns"></div>
             */
            self.$d = msp.Util.$$('#'+msp.Util.getId(), msp.$container).addClass('pns ').css({
                'bottom':-self.h,
                'height':self.h
            });
            
            /*
             * !! Panel widths and height follow the width of the map 
             */
            msp.Map.events.register("resizeend", self, function(){
                self.$d.width(msp.$container.width());
            });
            
            return self;
            
        };
        
        /**
         * Update tabs position
         * 
         * @input scope : reference to this object
         */
        this.updateTabs = function(scope) {
            
            var i,l,$t;
            
            /*
             * Set first item position
             */
            if (scope.items[0]) {
                scope.items[0].$tab.css({
                    left:0
                });
            }
            
            /*
             * Compute items position from the first item position
             */
            for (i = 1, l = scope.items.length; i < l; i++) {
                $t = scope.items[i-1].$tab;
                scope.items[i].$tab.css({
                    left:$t.position().left + $t.outerWidth() + 10
                });
            }
            
        };
        
        /**
         * Add an item to the panel
         * This function does nothing since it should be defined
         * in other classes or plugins (see SouthPanel for example)
         */
        this.add = function(content) {
            return false;
        };
        
        /**
         * Remove an item from the panel
         */
        this.remove = function(item) {
            
            var i,l,self = this;
            
            /*
             * Paranoid mode
             */
            if (!item) {
                return false;
            }
            
            /*
             * Roll over items to find the item to remove based on unique id
             */
            for (i = 0, l = this.items.length ; i < l; i++) {
                
                if (this.items[i].id === item.id) {
                    
                    /*
                     * Hide panel
                     */
                    self.hide(item);
                    
                    /*
                     * Remove item content
                     */
                    self.items[i].$d.remove();
                    self.items[i].$tab.remove();
                    
                    /*
                     * Remove item from the list of items
                     */
                    self.items.splice(i,1);
                    
                    /*
                     * Update tabs position
                     */
                    self.updateTabs(self);
                    
                    return true;
                }
            }
            
            return false;
        };
        
        /*
         * Show the panel
         * 
         * @input id : jquery object id to display within this panel
         */
        this.show = function(item) {
            
            var mc,mch,lon,lat,extent,self = this;
            
            /*
             * Paranoid mode
             */
            if (!item) {
                return false;
            }
            
            /*
             * Set item the new active item
             */
            self.setActive(item);
           
            /*
             * Set panel visibility
             */
            if (self.isVisible) {
            
                /*
                 * If onshow callback function is defined, call it
                 */
                /* TODO ??
                if (btn && $.isFunction(btn.onshow)) {
                    btn.onshow(btn.scope, btn);
                }*/
                /*
                 * Panel is already shown to the right div
                 */
                return false;
                
            }
            
            /*
             * Show panel
             */
            if (!self.over) {
                mc = msp.$map.parent(); // msp.$map container reference
                mch = msp.$map.height();
                extent = msp.Map.map.getExtent(),
                lon = (extent.right + extent.left) / 2;
                lat = ((((mc.height() - self.h) * (extent.bottom - extent.top)) / msp.$map.height()) + (2 * extent.top)) / 2;
            }
            
            
            /*
             * Show panel
             */
            self.$d.stop().animate(self.position === 'n' ? {
                'top':'0px'
            } : {
                'bottom':'0px'
            },
            {
                duration:200,
                queue:true,
                step:function(now,fx) {

                    /*
                     * Push the map
                     */ 
                    if (!self.over) {
                        mc.css('height', mch - self.h - now);
                    }

                },
                complete:function(){

                    /*
                     * Recenter map after its size change (unless panel "over" attribute is set to true)
                     */
                    if (!self.over) {
                        msp.Map.map.setCenter(new OpenLayers.LonLat(lon, lat), msp.Map.map.getZoom());
                        msp.events.trigger('resizeend');
                    }

                /*
                     * Triggers onshow and onhide button functions
                     */
                /* TODO ???
                    if (btn) {
                        if (action === "show" && $.isFunction(btn.onshow)) {
                            btn.onshow(btn.scope, btn);
                        }
                        else if (action === "hide" && $.isFunction(btn.onhide)) {
                            btn.onhide(btn.scope, btn);
                        }
                    }
                    */
                }
            });
            
            /*
             * Set the visible status to true
             */
            self.isVisible = true;
            
            return true;
            
        };
        
        /*
         * Return Panel item identified by id
         */
        this.get = function(id) {
            
            var i,l,self = this,item = null;
            
            /*
             * Roll over panel items
             */
            for (i = 0, l = self.items.length; i < l; i++) {
                if (self.items[i].id === id) {
                    item = self.items[i];
                    break;
                }
            }
            
            return item
        };
        
        /*
         * Hide the panel
         * 
         * @input item : item to hide
         */
        this.hide = function(item) {
            
            var mc,mch,lon,lat,extent,self = this;
            
            /*
             * If item is not active, do nothing
             */
            if (!self.active || self.active.id !== item.id) {
                return false;
            }
           
            /*
             * Remove active reference
             */
            self.active = null;
            
            /*
             * Set visible status to false
             */
            self.isVisible = false;
            
            /*
             * Hide panel
             */
            if (!self.over) {
                mc = msp.$map.parent(); // msp.$map container reference
                mch = msp.$map.height();
                extent = msp.Map.map.getExtent(),
                lon = (extent.right + extent.left) / 2;
                lat = ((((mc.height() + self.h) * (extent.bottom - extent.top)) / msp.$map.height()) + (2 * extent.top)) / 2;
            }
            
            self.$d.stop().animate(self.options.position === 'n' ? {
                'top':'-'+self.h+'px'
            } : {
                'bottom':'-'+self.h+'px'
            },
            {
                duration:200,
                queue:true,
                step:function(now,fx) {

                    /*
                     * Push the map
                     */ 
                    if (!self.over) {
                        mc.css('height', mch - now);
                    }

                },
                complete:function(){

                    /*
                     * Recenter map after its size change (unless panel "over" attribute is set to true)
                     */
                    if (!self.over) {
                        msp.Map.map.setCenter(new OpenLayers.LonLat(lon, lat), msp.Map.map.getZoom());
                        msp.events.trigger('resizeend');
                    }

                /*
                     * Triggers onshow and onhide button functions
                     */
                /* TODO ???
                    if (btn) {
                        if (action === "show" && $.isFunction(btn.onshow)) {
                            btn.onshow(btn.scope, btn);
                        }
                        else if (action === "hide" && $.isFunction(btn.onhide)) {
                            btn.onhide(btn.scope, btn);
                        }
                    }
                    */
                }
            });
            
            return true;
            
        };
        
        /*
         * Set item the new active item
         */
        this.setActive = function(item) {
            
            var self = this;
            
            /*
             * Hide all 'pnsi' divs
             */
            $('.pnsi',self.$d).each(function(index) {
                
                /*
                 * This is bit tricky.
                 * If panel item has a 'nodisplaynone' class, then the
                 * item is not hidden using jquery .hide() function, but
                 * instead it's position is set to somewhere outside the
                 * window display.
                 * This avoid the 'display:none' bug when hiding GoogleEarth plugin
                 * iframe for example
                 */
                var $t = $(this);
                $t.hasClass("nodisplaynone") ? $t.css({
                    'position':'absolute',
                    'top':'-1000px',
                    'left':'-1000px'
                }) : $t.hide();

            });

            /*
             * Remove active class from all tabs
             */
            $('.tab', self.$d).removeClass('active');
            
            /*
             * Show the input div
             * 
             * If panel item has a 'nodisplaynone' class, then the
             * item is not shown using jquery .show() function, but
             * instead it's absolute position is set to top:0px,left:0px
             * This avoid the 'display:none' bug when hiding GoogleEarth plugin
             * iframe for example
             * 
             */
            item.$d.hasClass("nodisplaynone") ? item.$d.css({
                'position':'static',
                'top':'0px',
                'left':'0px'
            }) : item.$d.show();

            
            /*
             * Set item tab active
             */
            item.$tab.addClass('active');

            /* 
             * Set the input $id as the new this.active item
             */
            self.active = item;
                
        };
        
        /*
         * Initialize object
         */
        return this.init();
      
    };
})(window.msp);