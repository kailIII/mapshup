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
/*********************************************
 * Plugin WPSClient
 *
 * Assisted Classification of eArth observation ImAges
 *
 *********************************************/
(function(msp) {
    
    msp.Plugins.WPSClient = function() {
        
        /*
         * Only one WPSClient object instance is created
         */
        if (msp.Plugins.WPSClient._o) {
            return msp.Plugins.WPSClient._o;
        }
        
        /*
         * Hasmap of WPS sources items store by WPS endpoint url
         * 
         * Structure of an item 
         *      {
         *          panel: // reference to panel
         *          $d: // reference to the panel jquery container
         *          wps: // reference to a WPS object
         *      }
         */
        this.items = [];
        
        /*
         * Initialization
         */
        this.init = function (options) {

            var self = this;
            
            /*
             * init options
             */
            self.options = options || {};
            
            /*
             * If url are set - Retrieve GetCapabilities
             */
            if (self.options.urls) {
                if (!$.isArray(self.options.urls)) {
                    self.add(self.options.urls);
                }
                else {
                    for (var i = 0, l = self.options.urls.length; i < l; i++) {
                        self.add(self.options.urls[i]);
                    }
                }
                
            }
            
            return self;
            
        };
        
        /*
         * Add a wps source from url
         */
        this.add = function(url) {
            
            var wps;
            
            /*
             * If url is set - Retrieve GetCapabilities
             */
            if (url) {
                
                /*
                 * Create a wps object
                 */
                wps = new msp.WPS(url);
                
               /*
                * Register WPS events
                */
                wps.events.register("getcapabilities", this, function(scope, wps) {
                    
                    /*
                     * Avoid multiple getcapabilities respawn
                     */
                    if (!scope.items[url]) {
                        
                        /*
                         * Create a panel for this WPS
                         */
                        var panel = msp.sp.add({
                            id:msp.Util.getId(),
                            icon:msp.Util.getImgUrl('configure.png'),
                            title:wps.title,
                            classes:"wpsclient",
                            html:'<div style="float:left;width:40%;"><div class="info"></div><div class="processes"></div></div><div style="float:right;width:60%;"><div class="describe"></div></div>'
                        });

                        /*
                         * Add a wps item to WPSClient
                         * with input url as the hash key
                         */
                        scope.items[url] = {
                            $d:panel.$content,
                            panel:panel,
                            wps:wps
                        };
                    
                    /*
                     * Tell user that a new WPS panel is created
                     */
                     msp.Util.message(msp.Util._("WPS server successfully added"));
                     
                    }   
                    
                    scope.updateCapabilitiesContent(scope.items[url]);
                    
                });
                
                wps.events.register("describeprocess", this, function(scope, processes) {
                    if ($.isArray(processes) && processes[0]) {
                        scope.updateDescribeProcessContent(processes[0]);
                    }
                });
            
                /*
                 * Retrieve capabilities
                 */
                wps.getCapabilities();
            }
            
        };
        
        /*
         * Add an item to South Panel
         * 
         * Container structure 
         * 
         *      <div class="pnsi wpsclient">
         *          <div style='float:left'>
         *              <div class="info">
         *                  <div class="title"></div>
         *                  <div class="description"></div>
         *              </div>
         *              <div class="processes">
         *              // Contains Processes list
         *              </div>
         *          </div>
         *          <div style='float:right'>
         *              <div class="describe">
         *              // Contains description of selected process
         *              </div>
         *              </div>
         *          </div>
         */
        this.updateCapabilitiesContent = function(item) {
            
            var id, process, identifier, $list;
            
            /*
             * Set info
             */
            $('.info', item.$d).html('<h1><a href="'+item.wps.url+'" title="'+item.wps.url+'" target="_blank">'+item.wps.title+'</a></h1><p>'+item.wps["abstract"]+'</p><br/><h1>'+msp.Util._('Processes')+'</h1>');
            
            $list = $('.processes', item.$d);
            
            for (identifier in item.wps.processes) {
                id = msp.Util.getId();
                process = item.wps.processes[identifier];
                $list.append('<a href="#" jtitle="'+process['abstract']+'" id="'+id+'" class="button inline">'+process.title+'</a> ');
                (function(process,$id, item) {
                    $id.click(function() {
                        $('a', $(this).parent()).removeClass('active');
                        $(this).addClass('active');
                        item.wps.describeProcess(process.identifier);
                        return false;
                    });
                    msp.tooltip.add($id, 'w', 10);
                })(process,$('#'+id), item);
            }
            
            $list.mCustomScrollbar();
            
        };
        
        /*
         * Update '.describe' content
         */
        this.updateDescribeProcessContent = function(process) {
            
            /*
             * Set info
             */
            $('.describe', process.$d).html('<h1 title="'+process.identifier+'">'+process.title+'</h1><p>'+process["abstract"]+'</p><br/>');
            
        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.WPSClient._o = this;
        
        return this;
    };
})(window.msp);