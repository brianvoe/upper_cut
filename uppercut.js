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
        auto: true, /* Auto upload upon file select */
        in_dialog_box: true, /* Show uploads and progress in dialog box */
        max_file_size: 10 * (1024 * 1024), /* Max file size in bytes - default 10mb */
        file_types: ['gif','png','jpg','jpeg'], /* Allowed file upload types */
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
            info.data.main_cont.find('.upcut_input_upload').change(function(event){
                if(info._validate_file(this.files[0])){
                    alert('validation successfull');
                }
                $(this).val(''); // Clear out input field
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
                info.browse_click();
            });

        },
        browse_click: function() {
            var info = ($.hasData(this) ? $(this).data('uppercut'): this);
            
            info.data.main_cont.find('.upcut_input_upload').click();
        },
        /*************************/
        /*** Private functions ***/
        /*************************/
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
        },
        _size_in_text: function (bytes) {  
            var kilobyte = 1024;
            var megabyte = kilobyte * 1024;
            var gigabyte = megabyte * 1024;
            var terabyte = gigabyte * 1024;
           
            if ((bytes >= 0) && (bytes < kilobyte)) {
                return bytes + ' B';
            } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
                return (bytes / kilobyte).toFixed(2) + ' KB';
            } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
                return (bytes / megabyte).toFixed(2) + ' MB';
            } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
                return (bytes / gigabyte).toFixed(2) + ' GB';
            } else if (bytes >= terabyte) {
                return (bytes / terabyte).toFixed(2) + ' TB';
            } else {
                return bytes + ' B';
            }
        },
        /* Get file info */
        _get_file_name: function(file) {
            return file.name;
        },
        _get_file_type: function(file) {
            return file.name.split('.').pop().toLowerCase();
        },
        /* Validate file functions */
        _validate_file: function(file) {
            var info = this;
            var valid = true;
            /* Make sure its a valid file type */
            if(!info._validate_file_type(file)){
                alert('Invalid file type');
                valid = false;
            }
            /* Make sure it doesnt exceed file size */
            if(!info._validate_file_size(file)) {
                alert('Exceeded max file size of '+info._size_in_text(info.options.max_file_size));
                valid = false;
            }
            return valid;
        },
        _validate_file_type: function(file) {
            var info = this;
            var name = file.name;
            var ext = name.split('.').pop().toLowerCase();
            if($.inArray(ext, info.options.file_types) == -1) {
                return false
            }
            return true;
        },
        _validate_file_size: function(file) {
            var info = this;
            return (file.size > info.options.max_file_size ? false: true);
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
                if(!$(this).data('uppercut')) {
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