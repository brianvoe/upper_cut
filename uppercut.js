/*
  Upload and crop jquery plugin
  Copyright (c) 2012 Brian Voelker (webiswhatido.com)
  Licensed under GPLv3
  http://www.opensource.org/licenses/gpl-3.0.html
  Version: 1
*/

(function($){

    /* Options */
    var upcut_options = {
        url: false, /* Url of location where upload image will go */
        in_dialog_box: true, /* Show uploads and progress in dialog box */
        max_file_size: 10240, /* Max file size in kb - default 10mb */
        /* Image button options - Default css button */
        browse_text: 'Browse', /* Text of default button */
        browse_image: false /* Image location of browse button */
    };

    /* Datas */
    var upcut_data = {
        main_id: null, /* Main container id */
        main_cont: null, /* Main container */
        html5: false /* Do not use html5 by defualt */
    };

    var uppercut_funcs = {
        /************************/
        /*** Public functions ***/
        /************************/
        create: function(options, input) {
            var info = this;

            /* Replace default options with requested options */
            info.options = $.extend({}, upcut_options, options);
            info.data = $.extend({}, upcut_data, {});
            
            /* Check if html */
            info._check_html5();

            /* Get or set id */
            if ($(input).attr('id')) {
                info.data.main_id = $(input).attr('id');
            } else {
                info.data.main_id = Math.ceil(Math.random() * 100000);
                $(input).attr('id', info.data.main_id);
            }
            info.data.main_cont = $(input);

            /* Add class to main container */
            info.data.main_cont.addClass('upcut_cont');

            /* Add hidden input file field */
            info.data.main_cont.append('<input style="display: none;" class="upcut_input_upload" type="file" name="upload" />');

            /* Add change event to upload file. */
            info.data.main_cont.find('.upcut_input_upload').change(function(){
                alert(info.data.main_cont.find('.upcut_input_upload').val());
            });
			
            /* Add upload click button */
            if(info.options.browse_image){
                /* Load image for button */
                info.data.main_cont.append('<div class="upcut_image_browse upcut_browse_btn"><img src="'+info.options.browse_image+'" /></div>');
            } else {
                /* Load css style browse button */
                info.data.main_cont.append('<div class="upcut_css_browse upcut_browse_btn">'+info.options.browse_text+'</div>');
            }
            
            /* Add click event to browse button */
            info.data.main_cont.find('.upcut_browse_btn').click(function(){
                info._browse_click();
            });

        },
        /*************************/
        /*** Private functions ***/
        /*************************/
        _browse_click: function() {
            var info = this;
            
            info.data.main_cont.find('.upcut_input_upload').click();
        },
        _add_iframe: function() {
            var info = this;
            
            $('<iframe id="someId"></iframe>').load(function(){
                $('#someId').contents().find('body').append('<form action="test.php" method="post" enctype="multipart/form-data"><input type="file" name="woot" id="myinput"></form>');
                var input = $('#someId').contents().find('input[type=file]');
                console.log(input);
                input.change(function() {
                    $(this).parent().submit();
                });
            }).appendTo(info.data.main_cont);
        },
        /*************************/
        /*** Misc functions ***/
        /*************************/
        _check_html5: function() {
        	var info = this;
        	if (window.FormData) {
				info.data.html5 = true;
			} 
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