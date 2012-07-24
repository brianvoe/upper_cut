/*
  Upload and crop jquery plugin
  Copyright (c) 2012 Brian Voelker (webiswhatido.com)
  Licensed under GPLv3
  http://www.opensource.org/licenses/gpl-3.0.html
  Version: 1
*/

(function($){

    /* Options */
    var options = {
        
    };

    /* Datas */
    var data = {
        main_id: null, /* Main container id */
        main_cont: null /* Main container */
    };

    var uppercut_funcs = {
        /************************/
        /*** Public functions ***/
        /************************/
        create: function(options, input) {
            var info = this;

            /* Replace default options with requested options */
            info.options = $.extend({}, options, options);
            info.data = $.extend({}, data, {});

            /* Get or set id */
            if ($(input).attr('id')) {
                info.data.main_id = $(input).attr('id');
            } else {
                info.data.main_id = Math.ceil(Math.random() * 100000);
                $(input).attr('id', info.data.main_id);
            }
            info.data.main_cont = $(input);

            /* Add buttons */
            info.data.main_cont.append('<a class="click_upload" href="javascript:;">Click to upload</a>');
            info.data.main_cont.find('.click_upload').click(function(){
                info.data.main_cont.find('.input_upload').click();
            });

            /* Add Input field */
            info.data.main_cont.append('<input style="display: none;" class="input_upload" type="file" name="upload" />');
        }
    };

    $.fn.uppercut = function(options) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.each(function() {
            /* Method calling logic */
            if (uppercut_funcs[options]) {
                if($(this).data('uppercut')) {
                    uppercut_funcs[options].apply(this, args);
                }
            } else if (typeof options === 'object' || !options) {
                if(!$(this).data('uppercut')){
                        var uppercut_obj = Object.create(uppercut_funcs);
                        uppercut_obj.create(options, this);
                        $.data(this, 'uppercut', uppercut_obj);
                }   
            } else {
                $.error('Method ' +  options + ' does not exist in Super Select');
            }
        });
    };

})(jQuery);

/* IE 8, 7 Compatibility */
if ( typeof Object.create !== 'function' ) {
    Object.create = function( obj ) {
        function F() {};
        F.prototype = obj;
        return new F();
    };
}