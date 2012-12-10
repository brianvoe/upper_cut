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
        /* Paths */
        upload_url: false, /* Url of location where upload image will go */
        crop_url: false, /* Url of location where to send crop parameters */

        /* Naming */
        upload_name: 'uc_image', /* Name of input field, will use this for post grabbing - Multiple images will automatically add [] to the end of the name */

        /* Preferences */
        html5: true, /* Whether or not to use html5 version of uploading - If browser is not capable it will be set to false */
        multiple: true, /* Whether or not its multiple select - If not html5 compatible it will be set to false */
        max_upload: 5, /* Max amount of upload allowed */
        debug: false, /* Console.log errors as they are added */

        /* Images */
        images_width: 100, /* Images max width */
        images_height: 100, /* Images max height */
        images_edit_val: 'Edit', /* Value of edit button - false if dont want to show edit button */
        images_delete_val: 'Delete', /* Value of delete button - false if dont want to show delete button */

        /* Input fields */
        input_type: 'advanced', /* Saved input fields type - simple(Just input field with value of final path) or advanced(Array of information various information) */

        /* Crop */
        crop: true, /* Whether or not to crop image after upload - If true, multiple will be set to false */
        crop_title: 'Crop Image', /* Title of crop dialog box show at top of crop box */
        crop_square: false, /* Whether or not to keep square 1 by 1 aspect ratio */
        crop_force: false, /* When uploading disable multiple image selection (cause we would want to make the user crop after each upload) but allow multiple images to be uploaded */

        /* Browse Button */
        browse_button: true, /* Whether or not to show browse button */
        browse_button_text: 'Browse', /* Text of default button */
        browse_image: false, /* Image location of browse button */
        browse_primary: false, /* Use browse button for primary image - Must be single use only */

        /* Clear Button */
        clear_button: false, /* Whether or not to show clear button */
        clear_button_text: 'Clear', /* Text for clear button */

        /* Display Progress */
        name_char_limit: 20, /* Character limit of display name */

        /* Validations */
        max_file_size: 10 * (1024 * 1024), /* Max file size in bytes - default 10mb */
        file_types: ['gif','png','jpg','jpeg'], /* Allowed file upload types */

        /* Misc */
        ie_img_cache: true /* Add timestamp to end of img src to bypass ie image cache issue */
    };

    /* Datas */
    var upcut_data = {
        main_id: null, /* Main container id */
        main_cont: null, /* Main container */
        errors: {}, /* Associative array list errors */
        items: {}, /* Array for storing items */
        cur_order: 0, /* Current order number */
        browse_btn: false, /* Basically global variable for current browse button */
        image_array: {name: false, path: false, size: false, height: false, width: false, type: false}, /* Image array of useful information */
        image_coords: {x: false, y: false, w: false, h: false}, /* Crop coordinates */
        image_types: ['gif','png','jpg','jpeg','tiff','bmp'] /* Full allowed image types */
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

            /* Reset data */
            info.data.errors = {};
            info.data.items = {};
            
            /* Check if html5 */
            info._check_html5();

            /* Check crop */
            if(!info.options.crop_url) {
                /* If no crop url set crop to false */
                info.options.crop = false;
            }

            /* Deal with stupid internet explorer */
            if ($.browser.msie) {
                /* Force iframe upload */
                info.options.html5 = false;

                /* Add error to array */
                info._add_error('using_ie', 'For some reason your using internet explorer');
            }

            /* If browse button is the primary image force single image */
            if(info.options.browse_primary) {
                info.options.multiple = false;
            }

            /* Get or set id */
            if ($(input).attr('id')) {
                info.data.main_id = $(input).attr('id');
            } else {
                info.data.main_id = info._unique_id();
                $(input).attr('id', info.data.main_id);
            }
            info.data.main_cont = $(input);

            /* Add class to main container */
            info.data.main_cont.addClass('upcut_cont');

            /* Add button container */
            info.data.main_cont.append('<div class="upcut_buttons"></div>');

            /* Add general message */
            info.data.main_cont.append('<div class="upcut_general_msg"></div>');

            /* Add div for holding hidden input fields */
            info.data.main_cont.append('<div class="upcut_inputs"></div>');

            /* Add div for queue purposes */
            info.data.main_cont.append('<div class="upcut_queue"></div>');

            /* Add div for holding hidden input fields */
            info.data.main_cont.append('<div class="upcut_images"></div>');

            /* If crop add crop div */
            if(info.options.crop) {
                info.data.main_cont.append('<div class="upcut_crop"></div>');
            }

            /* Add upload click button */
            if(info.options.browse_button) {
                /* Add browse div */
                info.data.main_cont.find('.upcut_buttons').append('<div class="upcut_browse"></div>');

                if(info.options.browse_image){
                    /* Load image for button */
                    var browse_image_value = (info.options.browse_image.indexOf('<img') !== -1 ? info.options.browse_image: '<img src="'+info.options.browse_image+'" />');
                    info.data.browse_btn = '<div class="upcut_image_browse">'+browse_image_value+'</div>';
                    info.data.main_cont.find('.upcut_buttons .upcut_browse').html(info.data.browse_btn);

                    /* Add click event to browse button */
                    info.data.main_cont.find('.upcut_browse .upcut_image_browse').click(function(){
                        info.browse();
                    });
                } else {
                    /* Load css style browse button */
                    info.data.browse_btn = '<div class="upcut_btn upcut_btn_browse">'+info.options.browse_button_text+'</div>';
                    info.data.main_cont.find('.upcut_buttons .upcut_browse').html(info.data.browse_btn);

                    /* Add click event to browse button */
                    info.data.main_cont.find('.upcut_browse .upcut_btn_browse').click(function(){
                        info.browse();
                    });
                }
            }

            /* Add clear button */
            if(info.options.clear_button) {
                info.data.main_cont.find('.upcut_buttons').append('<div class="upcut_btn upcut_btn_clear">'+info.options.clear_button_text+'</div>');

                /* Add click event for upload button */
                info.data.main_cont.find('.upcut_btn_clear').click(function(){
                    info.clear();
                });
            }

            /* Set whether or not to use html5 uploader or older single upload */            
            if(info.options.html5) {
                /* html5 upload creation */

                /* Add hidden input file field */
                info.data.main_cont.append('<input style="display: none;" '+(info.options.multiple && !info.options.crop_force ? 'multiple="multiple"' : '')+' class="upcut_input_upload" type="file" />');

                /* Add change event to upload file */
                info.data.main_cont.find('.upcut_input_upload').change(function(){
                    /* Process files */
                    info._process_html5_files(this.files);

                    $(this).val(''); /* Clear out input field */
                });
            }
        },
        add: function(import_data) { /* Programmably allow user to import images via data */
            var info = ($.hasData(this) ? $(this).data('uppercut'): this);

            /* Current number of files */
            var current_count = info._object_length(info.data.items);

            /* Validate max upload amount */
            if(current_count >= info.options.max_upload) {
                info._general_message('error', 'Exceeded max file count of '+info.options.max_upload);
                return;
            }

            /* Ensure they pass all file info needed */
            if(!import_data.original) {
                info._general_message('error', 'Must send at least original image information');
                return;
            }
            if(!info._validate_return_data(import_data.original)) {
                return;
            }

            /* Validate file */
            var validate = info._validate_file(import_data.original);
            if(validate !== true) {
                info._general_message('error', validate);
                return;
            }

            /* Add new data item */
            var item_id = info._add_data_item();
            var thumbnail = import_data.original;

            /* Add status data */
            info.data.items[item_id].status = 'import';

            /* Add data to data */
            if(import_data.data) {
                info.data.items[item_id].import_data = {};
                $.each(import_data.data, function(import_key, import_value) {
                    info.data.items[item_id].import_data[import_key] = import_value;
                });
            }

            /* Add original data */
            info.data.items[item_id].orig_image = import_data.original;

            /* Add crop data */
            if(import_data.crop && info._validate_return_data(import_data.crop)) {
                info.data.items[item_id].crop_image = import_data.crop;
                thumbnail = import_data.crop;

                /* Check for coords */
                if(!import_data.crop.coords) {
                    info.data.items[item_id].crop_image.coords = info.data.image_coords;
                }
            }

            /* Add thumbnail data */
            if(import_data.thumbnail && info._validate_return_data(import_data.thumbnail)) {
                info.data.items[item_id].thumb_image = import_data.thumbnail;
                thumbnail = import_data.thumbnail;
            }

            /* Add image thumbnail */
            info._add_image_thumbnail(item_id, thumbnail);

            /* Add input field */
            info._add_image_input(item_id);
        },
        data: function() {
            var info = ($.hasData(this) ? $(this).data('uppercut'): this);

            if(typeof console != 'undefined') {
                console.log(info.data.items);
            }
        },
        browse: function() {
            var info = ($.hasData(this) ? $(this).data('uppercut'): this);

            if(info.options.html5) { /* html5 */
                info.data.main_cont.find('.upcut_input_upload').click();
            } else { /* Old school */
                info._add_iframe();
            }
        },
        upload: function() {
            var info = ($.hasData(this) ? $(this).data('uppercut'): this);

            if(info.options.html5) { /* html5 */
                
            } else { /* Old school */
                
            }
        },
        clear: function() {
            var info = ($.hasData(this) ? $(this).data('uppercut'): this);

            /* Clear input fields */
            info.data.main_cont.find('.upcut_inputs').html('');

            /* Clear images */
            info.data.main_cont.find('.upcut_images').html('');

            /* Clear out queue */
            info.data.main_cont.find('.upcut_queue .upcut_queue_item').remove();

            /* Remove data items */
            info.data.items = {};
        },
        destroy: function() {
            var info = ($.hasData(this) ? $(this).data('uppercut'): this);

            /* Remove Content */
            info.data.main_cont.html('');

            /* Remove Class */
            info.data.main_cont.removeClass('upcut_cont');

            /* Destroy Data */
            $(this).removeData('uppercut');
        },
        errors: function() {
            var info = ($.hasData(this) ? $(this).data('uppercut'): this);

            if(typeof console != 'undefined') {
                console.log(info.data.errors);
            }
        },
        /***************************/
        /*** Data item functions ***/
        /***************************/
        _add_data_item: function() {
            var info = this;

            var item_id = new Date().getTime();

            /* Set variables */
            info.data.items[item_id] = {
                order: info.data.cur_order,
                status: false,
                frame_id: false,
                queue_id: false,
                thumbnail: {id: false, src: false},
                input_id: false,
                input_path: false,
                import_data: false,
                orig_image: jQuery.extend({}, info.data.image_array),
                crop_image: jQuery.extend({}, info.data.image_array),
                thumb_image: jQuery.extend({}, info.data.image_array)
            };

            /* Add Crop stuff */
            info.data.items[item_id].crop_image.coords = jQuery.extend({}, info.data.image_coords);

            /* Increment current order */
            info.data.cur_order++;

            return item_id;
        },
        _update_data_item_input_path: function(item_id, input_path) {
            var info = this;

            info.data.items[item_id].input_path = input_path;
        },
        _remove_data_item: function(item_id) {
            var info = this;

            delete info.data.items[item_id];
        },
        /***********************/
        /*** Error functions ***/
        /***********************/
        _add_error: function(key, value) {
            var info = this;

            info.data.errors[key] = value;

            if(info.options.debug && typeof console != 'undefined') {
                console.log(key+' - '+value);
            }
        },
        /**************************/
        /*** Messages functions ***/
        /**************************/
        _general_message: function(status, msg) {
            var info = this;

            info.data.main_cont.find('.upcut_general_msg').html('<div class="msg_'+status+'">'+msg+'</div>');

            info.data.main_cont.find('.upcut_general_msg').slideDown('fast', function() {
                setTimeout(function(){
                    info.data.main_cont.find('.upcut_general_msg').slideUp('fast', function() {
                        info.data.main_cont.find('.upcut_general_msg').html('');
                    });
                }, 3000);
            });
        },
        /***********************/
        /*** Input functions ***/
        /***********************/
        _add_image_input: function(item_id) { /* Add input fields from data */
            var info = this;
            var input_id = (info.data.items[item_id].input_id ? info.data.items[item_id].input_id: info._unique_id());
            var input_name = info.options.upload_name+(info.options.multiple ? '['+info.data.items[item_id].order+']': '');

            /* Add input to data item */
            if(!info.data.items[item_id].input_id){
                info.data.items[item_id].input_id = input_id;
                info.data.main_cont.find('.upcut_inputs').append('<div id="'+input_id+'"></div>');
            }

            /* Empty out inputs div */
            info.data.main_cont.find('.upcut_inputs #'+input_id).html('');

            if(info.options.input_type == 'simple') {
                /* Simple input */

                /* Add input field */
                info.data.main_cont.find('.upcut_inputs #'+input_id).append('<input type="hidden" name="'+input_name+'" value="'+info.data.items[item_id].input_path+'" />');
            } else {
                /* Advanced input */

                /* Add Status */
                info.data.main_cont.find('.upcut_inputs #'+input_id).append('<input type="hidden" name="'+input_name+"['status']"+'" value="'+info.data.items[item_id].status+'" />');

                /* Add Import data */
                if(info.data.items[item_id].import_data) {
                    $.each(info.data.items[item_id].import_data, function(import_key, import_value) {
                        info.data.main_cont.find('.upcut_inputs #'+input_id).append('<input type="hidden" name="'+input_name+"['data']['"+import_key+"']"+'" value="'+import_value+'" />');
                    });
                }
                
                /* Add original input field */
                if(info.data.items[item_id].orig_image.name) {
                    info.data.main_cont.find('.upcut_inputs #'+input_id).append('<input type="hidden" name="'+input_name+"['original']['name']"+'" value="'+info.data.items[item_id].orig_image.name+'" />');
                    info.data.main_cont.find('.upcut_inputs #'+input_id).append('<input type="hidden" name="'+input_name+"['original']['path']"+'" value="'+info.data.items[item_id].orig_image.path+'" />');
                }

                /* Add crop input field */
                if(info.data.items[item_id].crop_image.name) {
                    info.data.main_cont.find('.upcut_inputs #'+input_id).append('<input type="hidden" name="'+input_name+"['crop']['name']"+'" value="'+info.data.items[item_id].crop_image.name+'" />');
                    info.data.main_cont.find('.upcut_inputs #'+input_id).append('<input type="hidden" name="'+input_name+"['crop']['path']"+'" value="'+info.data.items[item_id].crop_image.path+'" />');
                    /* Crops x and y directions */
                    if(info.data.items[item_id].crop_image.coords) {
                        info.data.main_cont.find('.upcut_inputs #'+input_id).append('<input type="hidden" name="'+input_name+"['crop']['coords']['x']"+'" value="'+info.data.items[item_id].crop_image.coords.x+'" />');
                        info.data.main_cont.find('.upcut_inputs #'+input_id).append('<input type="hidden" name="'+input_name+"['crop']['coords']['y']"+'" value="'+info.data.items[item_id].crop_image.coords.y+'" />');
                        info.data.main_cont.find('.upcut_inputs #'+input_id).append('<input type="hidden" name="'+input_name+"['crop']['coords']['w']"+'" value="'+info.data.items[item_id].crop_image.coords.w+'" />');
                        info.data.main_cont.find('.upcut_inputs #'+input_id).append('<input type="hidden" name="'+input_name+"['crop']['coords']['h']"+'" value="'+info.data.items[item_id].crop_image.coords.h+'" />');
                    }
                }

                /* Add thumb input field */
                if(info.data.items[item_id].thumb_image.name) {
                    info.data.main_cont.find('.upcut_inputs #'+input_id).append('<input type="hidden" name="'+input_name+"['thumb']['name']"+'" value="'+info.data.items[item_id].thumb_image.name+'" />');
                    info.data.main_cont.find('.upcut_inputs #'+input_id).append('<input type="hidden" name="'+input_name+"['thumb']['path']"+'" value="'+info.data.items[item_id].thumb_image.path+'" />');
                }
            }
        },
        _update_image_order: function() {
            var info = this;

            /* Loop through each item and add input fields */
            $.each(info.data.items, function(item_id, value) {
                /* Readd input info back */
                info._add_image_input(item_id);
            });
        },
        _remove_image_input: function(item_id, input_id) {
            var info = this;

            /* Remove input div */
            info.data.main_cont.find('.upcut_inputs #'+input_id).remove();
        },
        /****************************************/
        /*** Image/Thumbnail functions ***/
        /****************************************/
        _add_image_thumbnail: function(item_id, file_info) {
            var info = this;
            var thumb_id = info._unique_id();

            /* Add data item thumb */
            info.data.items[item_id].thumbnail.id = thumb_id;
            info.data.items[item_id].thumbnail.src = file_info.path;

            if(info.options.browse_primary) {
                /* Use browse image as primary image */
                info.data.main_cont.find('.upcut_buttons .upcut_browse').html('<div class="upcut_image_browse"><img style="max-width: '+info.options.images_width+'px; max-height: '+info.options.images_height+'px;" src="'+file_info.path+(info.options.ie_img_cache && $.browser.msie ? '?'+new Date().getTime():'')+'" /></div>');

                /* Add click event to browse button */
                info.data.main_cont.find('.upcut_buttons .upcut_browse .upcut_image_browse').click(function(){
                    info.browse();
                });

                /* Append thumb tool div */
                info.data.main_cont.find('.upcut_buttons .upcut_browse').append('<div class="upcut_thumb_tools"></div>');

                /* Add edit buttons */
                if(info.options.images_edit_val) {
                    /* Append edit button */
                    info.data.main_cont.find('.upcut_buttons .upcut_browse .upcut_thumb_tools').append('<div class="upcut_thumb_edit">'+info.options.images_edit_val+'</div>');

                    /* Add click button */
                    info.data.main_cont.find('.upcut_buttons .upcut_browse .upcut_thumb_tools .upcut_thumb_edit').click(function(){
                        info._edit_image_thumbnail(item_id);
                    });
                }

                /* Add event listener for delete */
                if(info.options.images_delete_val) {
                    /* Append delete button */
                    info.data.main_cont.find('.upcut_buttons .upcut_browse .upcut_thumb_tools').append('<div class="upcut_thumb_delete">'+info.options.images_delete_val+'</div>');

                    info.data.main_cont.find('.upcut_buttons .upcut_browse .upcut_thumb_tools .upcut_thumb_delete').click(function(){
                        info._remove_image_thumbnail(item_id);
                    });
                }
            } else {
                /* Put together thumb div */
                var image_thumb = '';
                image_thumb += '<div id="'+thumb_id+'" class="upcut_thumb">';
                image_thumb += '    <div class="upcut_thumb_img" style="width: '+info.options.images_width+'px; height: '+info.options.images_height+'px;">';
                image_thumb += '        <img style="max-width: '+info.options.images_width+'px; max-height: '+info.options.images_height+'px;" src="'+file_info.path+(info.options.ie_img_cache && $.browser.msie ? '?'+new Date().getTime():'')+'" />';
                image_thumb += '    </div>';
                image_thumb += '    <div class="upcut_thumb_tools">';
                image_thumb += '        <div '+(info.options.crop ? '': 'style="display: none;"')+' class="upcut_thumb_edit">'+info.options.images_edit_val+'</div>';
                image_thumb += '        <div class="upcut_thumb_delete">'+info.options.images_delete_val+'</div>';
                image_thumb += '    </div>';
                image_thumb += '</div>';
                info.data.main_cont.find('.upcut_images').append(image_thumb);

                /* Center image */
                var thumb_img = info.data.main_cont.find('.upcut_images #'+thumb_id+' .upcut_thumb_img img').load(function() {
                    thumb_img.css({
                        'margin-top': Math.ceil((info.options.images_height-thumb_img.height()) / 2)+'px',
                        'margin-left': Math.ceil((info.options.images_width-thumb_img.width()) / 2)+'px'
                    });
                });

                /* Add event listener for edit */
                info.data.main_cont.find('.upcut_images #'+thumb_id+' .upcut_thumb_edit').click(function(){
                    info._edit_image_thumbnail(item_id);
                });

                /* Add event listener for delete */
                info.data.main_cont.find('.upcut_images #'+thumb_id+' .upcut_thumb_delete').click(function(){
                    info._remove_image_thumbnail(item_id);
                });

                /* Add sortable if jquery ui exists*/
                if(jQuery().sortable) {
                    info.data.main_cont.find('.upcut_images').disableSelection()
                    .sortable({handle: '.upcut_thumb_img', stop: function(){
                        info._move_image_thumbnail(item_id);
                    }});
                }
            }
        },
        _update_image_thumbnail: function(item_id, thumb_id, file_info) {
            var info = this;

            /* Update data thumbnail src */
            info.data.items[item_id].thumbnail.src = file_info.path;

            /* Update thumbnail src */
            if(info.options.browse_primary) {
                info.data.main_cont.find('.upcut_buttons .upcut_browse .upcut_image_browse img').attr('src', file_info.path+(info.options.ie_img_cache && $.browser.msie ? '?'+new Date().getTime():''));
            } else {
                info.data.main_cont.find('.upcut_images #'+thumb_id+' .upcut_thumb_img img').attr('src', file_info.path+(info.options.ie_img_cache && $.browser.msie ? '?'+new Date().getTime():''));
            }
        },
        _move_image_thumbnail: function(item_id) {
            var info = this;

            /* Get order of images */
            info.data.main_cont.find('.upcut_images .upcut_thumb').each(function(img_index) {
                var thumb_id = $(this).attr('id');
                $.each(info.data.items, function(item_index, value) {
                    if(thumb_id == value.thumbnail.id) {
                        /* Update data order */
                        info.data.items[item_index].order = img_index;
                    }
                });
            });

            /* Update input field order */
            info._update_image_order();
        },
        _edit_image_thumbnail: function(item_id) {
            var info = this;

            /* Grab original image and start cropping again */
            info._crop_start(item_id, info.data.items[item_id].orig_image, true);
        },
        _remove_image_thumbnail: function(item_id) {
            var info = this;

            /* REMOVING THUMBNAIL MUST REMOVE ALL DATA AND INPUTS FOR THAT IMAGE */

            if(info.options.browse_primary) {
                /* Add browse button back */
                info.data.main_cont.find('.upcut_buttons .upcut_browse').html(info.data.browse_btn);

                /* Add click event to browse button */
                if(info.options.browse_image){
                    info.data.main_cont.find('.upcut_buttons .upcut_browse .upcut_image_browse').click(function(){
                        info.browse();
                    });
                } else {
                    info.data.main_cont.find('.upcut_buttons .upcut_browse .upcut_btn_browse').click(function(){
                        info.browse();
                    });
                }
            } else {
                /* Remove thumbnail */
                info.data.main_cont.find('.upcut_images #'+info.data.items[item_id].thumbnail.id).remove();
            }

            /* Remove input */
            info.data.main_cont.find('.upcut_inputs #'+info.data.items[item_id].input_id).remove();
            
            /* Remove data item */
            info._remove_data_item(item_id);
        },
        /****************************************/
        /*** Display and Processing functions ***/
        /****************************************/
        _add_to_queue: function(queue_id) {
            var info = this;

            /* Add queue container */
            var cont = '';
            cont += '<div style="display: none;" class="upcut_queue_item" id="'+queue_id+'">';
            cont += '   <div class="upcut_queue_display"></div>'; /* Display */
            cont += '   <div class="upcut_queue_status"></div>'; /* Status */
            cont += '   <div style="clear: both;"></div>';
            cont += '   <div class="upcut_queue_progress">'; /* Progress Bar */
            cont += '       <div class="upcut_progress_bar"></div>';
            cont += '   </div>';
            cont += '</div>';
            info.data.main_cont.find('.upcut_queue').append(cont);

            return;
        },
        _update_queue_status: function(item_id, queue_id, status, msg) {
            var info = this;

            /* Make sure queue is showing */
            info.data.main_cont.find('.upcut_queue #'+queue_id).show();

            /* Add Message */
            info.data.main_cont.find('.upcut_queue #'+queue_id+' .upcut_queue_status').html('<div class="queue_'+status+'">'+msg+'</div>');

            /* If status is error hide progress bar */
            if(status == 'error') {
                info.data.main_cont.find('.upcut_queue #'+queue_id+' .upcut_queue_progress').hide();
            }
        },
        _add_file_to_queue: function(item_id, queue_id, file_info) { /* Take selected file info and add to queue display */
            var info = this;

            /* Make sure queue is showing */
            info.data.main_cont.find('.upcut_queue #'+queue_id).show();

            /* Add name to queue display */
            var text = '';
            text += '<div style="float: left;">Name: '+info._minimize_file_name(file_info.name, info.options.name_char_limit)+'</div>';
            text += '<div style="float: right;">'+(file_info.size > 0 ? 'Size: '+info._size_in_text(file_info.size) : '')+'</div>';
            text += '<div style="clear: both;"></div>';
            info.data.main_cont.find('.upcut_queue #'+queue_id+' .upcut_queue_display').html(text);

            return;
        },
        _remove_queue_item: function(item_id, queue_id) {
            var info = this;
            setTimeout(function(){
                info.data.main_cont.find('.upcut_queue #'+queue_id).slideUp('slow', function() {
                    $(this).remove();

                    /* Remove queue_id from data item */
                    if(info.data.items[item_id] && info.data.items[item_id].queue_id) {
                        info.data.items[item_id].queue_id = false;
                    }
                });
            }, 3000);
        },
        _animate_progress: function(item_id, queue_id, speed, percent) {
            var info = this;

            /* Make sure queue is showing */
            info.data.main_cont.find('.upcut_queue #'+queue_id).show();

            /* Animate progress bar */
            info.data.main_cont.find('.upcut_queue #'+queue_id+' .upcut_queue_progress .upcut_progress_bar').animate({
                width: percent+'%'
            }, speed);
        },
        /***********************/
        /*** Html5 functions ***/
        /***********************/
        _process_html5_files: function(files) {
            var info = this;

            /* If multiple is false clear queue */
            if(!info.options.multiple) {
                info.clear();
            }

            /* Current number of files */
            var current_count = info._object_length(info.data.items);

            /* Loop though each file and start processing */
            $.each(files, function(index, file) {
                /* Validate max upload amount */
                if(current_count >= info.options.max_upload) {
                    info._general_message('error', 'Exceeded max file count of '+info.options.max_upload);
                    return;
                }

                /* Add new queue */
                var queue_id = info._unique_id();
                info._add_to_queue(queue_id);
                
                /* Add new data item */
                var item_id = info._add_data_item();
                info.data.items[item_id].queue_id = queue_id;

                /* Add status data */
                info.data.items[item_id].status = 'new';

                /* Add info to queue display */
                info._add_file_to_queue(item_id, queue_id, file);
                
                /* Validate each file */
                var validate = info._validate_file(file);
                if(validate === true) {
                    /* Start uploading file */
                    info._start_html5_upload(item_id, file, queue_id);
                } else {
                    /* Fail show file errors */
                    info._update_queue_status(item_id, queue_id, 'error', validate);

                    /* Remove queue */
                    info._remove_queue_item(item_id, queue_id);

                    /* Remove data */
                    info._remove_data_item(item_id);
                }

                /* Add to files_count */
                current_count++;
            });

            return;
        },
        _start_html5_upload: function(item_id, file, queue_id) {
            var info = this;

            /* Set form data */
            var form_data = new FormData();
            form_data.append(info.options.upload_name, file);

            /* Make ajax request */
            $.ajax({
                url: info.options.upload_url,
                type: 'POST',
                data: form_data,
                cache: false,
                contentType: false,
                processData: false,
                success: function(return_info) {
                    /* Validate json string */
                    if(!info._validate_json_str(return_info)) {
                        /* Add error */
                        info._add_error('upload_submit', 'Return info was not a proper json string');

                        /* Error */
                        info._update_queue_status(item_id, queue_id, 'error', 'There was a problem submitting your image');

                        /* Remove queue */
                        info._remove_queue_item(item_id, queue_id);

                        /* Remove data */
                        info._remove_data_item(item_id);

                        return;
                    }
                
                    return_info = $.parseJSON(return_info);
                    if(return_info.status == 'error') {
                        /* Script returned error */
                        info._update_queue_status(item_id, queue_id, 'error', return_info.info);

                        /* Add error to array */
                        info._add_error('html5_upload', return_info.info);

                        /* Remove queue display */
                        info._remove_queue_item(item_id, queue_id);

                        /* Remove data */
                        info._remove_data_item(item_id);
                    } else {
                        /* Success */
                        info._update_queue_status(item_id, queue_id, 'success', 'Success!');

                        /* Set variable */
                        var thumbnail = return_info.file;

                        /* Remove queue display */
                        info._remove_queue_item(item_id, queue_id);

                        /* Add file info to data item */
                        info.data.items[item_id].orig_image.name = return_info.file.name;
                        info.data.items[item_id].orig_image.path = return_info.file.path;
                        info.data.items[item_id].orig_image.size = return_info.file.size;
                        info.data.items[item_id].orig_image.height = return_info.file.height;
                        info.data.items[item_id].orig_image.width = return_info.file.width;
                        info.data.items[item_id].orig_image.type = return_info.file.type;

                        /* Check for thumbnail */
                        if(return_info.thumbnail) {
                            /* Add file info to data item thumbnail */
                            info.data.items[item_id].thumb_image.name = return_info.thumbnail.name;
                            info.data.items[item_id].thumb_image.path = return_info.thumbnail.path;
                            info.data.items[item_id].thumb_image.size = return_info.thumbnail.size;
                            info.data.items[item_id].thumb_image.height = return_info.thumbnail.height;
                            info.data.items[item_id].thumb_image.width = return_info.thumbnail.width;
                            info.data.items[item_id].thumb_image.type = return_info.thumbnail.type;

                            /* thumbnail will use thumbnail appose to orig image */
                            thumbnail = return_info.thumbnail;
                        }

                        /* If crop add image and initiate jcrop */
                        if(info.options.crop && (info.options.crop_force || !info.options.multiple)) {
                            info._crop_start(item_id, return_info.file, false);
                        } else {
                            /* Change data input_path */
                            info._update_data_item_input_path(item_id, return_info.file.path);

                            /* If no crop finalize upload and add hidden input field to final div location */
                            info._add_image_input(item_id);

                            /* Add thumbnail */
                            info._add_image_thumbnail(item_id, thumbnail);
                        }
                    }
                },
                error: function(error) {
                    /* Script returned error */
                    info._update_queue_status(item_id, queue_id, 'error', error);

                    /* Add error to array */
                    info._add_error('html5_upload', error);

                    /* Remove queue display */
                    info._remove_queue_item(item_id, queue_id);
                },
                xhr: function() {
                    var myXhr = $.ajaxSettings.xhr();
                    if(myXhr.upload){
                        myXhr.upload.addEventListener('progress', function(evt) {                           
                            info._animate_progress(item_id, queue_id, 200, ((evt.loaded / evt.total) * 100));
                        }, false);
                    } else {
                        /* Script returned error */
                        info._update_queue_status(item_id, queue_id, 'error', 'Upload progress is not supported.');

                        /* Add error to array */
                        info._add_error('html5_upload', 'Upload progress is not supported.');

                        /* Remove queue display */
                        info._remove_queue_item(item_id, queue_id);
                    }
                    return myXhr;
                }
            });
        },
        /************************/
        /*** Iframe functions ***/
        /************************/
        _add_iframe: function() {
            var info = this;

            /* If multiple is false clear queue */
            if(!info.options.multiple) {
                info.clear();
            }
            
            /* Current number of files */
            var current_count = info._object_length(info.data.items);

            /* Validate max upload amount */
            if(current_count >= info.options.max_upload) {
                info._general_message('error', 'Exceeded max file count');
            } else {
                /* Set variables */
                var frame_id = info._unique_id();
                var iframe_cont;

                /* Add new addition to queue */
                var queue_id = info._unique_id();
                info._add_to_queue(queue_id);

                /* Create iframe and add to queue */
                iframe_cont = $('<iframe src="about:blank" style="display: none;" class="upcut_queue_iframe" id="'+frame_id+'"></iframe>');
                iframe_cont.load(function(){
                    var form_txt = '';
                    form_txt += '<form action="'+info.options.upload_url+'" method="post" enctype="multipart/form-data">';
                    form_txt += '   <input style="display: none;" type="file" name="'+info.options.upload_name+'" />';
                    form_txt += '</form>';

                    iframe_cont.contents().find('body').append(form_txt);
                    
                    /* Listen out for input field file selection */
                    iframe_cont.contents().find('input[type=file]').change(function(input_file) {
                        var file_info = input_file.files;
 
                        if(!file_info) {
                            // IE file info alternative
                            file_info = {};
                            file_info.name = info._get_file_name_from_path(this.value);
                            try {
                                var fs = new ActiveXObject('Scripting.FileSystemObject');
                                var file = fs.getFile(this.value);
                                file_info.size = file.size;
                            } catch(ex) {
                                file_info.size = 0;
                            }
                        } else if(file_info.length > 0) {
                            file_info = file_info[0];
                        }


                        /* Add new data item_id */
                        var item_id = info._add_data_item();

                        /* Add status data */
                        info.data.items[item_id].status = 'new';

                        /* Add frame_id and queue_id to data item_id */
                        info.data.items[item_id].frame_id = frame_id;
                        info.data.items[item_id].queue_id = queue_id;

                        /* Add info to queue display */
                        info._add_file_to_queue(item_id, queue_id, file_info);

                        /* Validate each file */
                        var validate = info._validate_file(file_info);
                        if(validate === true) {
                            /* Upload file */
                            info._start_iframe_upload(item_id, file_info, frame_id, iframe_cont, queue_id);
                        } else {
                            /* Fail show file errors */
                            info._update_queue_status(item_id, queue_id, 'error', validate);

                            /* Remove queue */
                            info._remove_queue_item(item_id, queue_id);

                            /* Remove data */
                            info._remove_data_item(item_id);
                        }
                    });
                }).appendTo(info.data.main_cont.find('.upcut_queue #'+queue_id));

                /* Click input field to select file */
                /* Set timeout this is a fix for ie and firefox */
                setTimeout(function(){
                    iframe_cont.contents().find('input[type=file]').click();
                }, 500);
            }
        },
        _start_iframe_upload: function(item_id, file_info, frame_id, iframe_cont, queue_id) {
            var info = this;
            var return_info;

            iframe_cont.contents().find('body form').submit();

            info._animate_progress(item_id, queue_id, 1000, 100);

            iframe_cont.load(function() {
                iframe_cont.contents().find('body form').remove(); /* Remove form */

                /* Validate json string */
                if(!info._validate_json_str(iframe_cont.contents().find('body').html())) {
                    /* Add error */
                    info._add_error('upload_submit', 'Return info was not a proper json string');

                    /* Error */
                    info._update_queue_status(item_id, queue_id, 'error', 'There was a problem submitting your image');

                    /* Remove queue */
                    info._remove_queue_item(item_id, queue_id);

                    /* Remove data */
                    info._remove_data_item(item_id);

                    return;
                }

                return_info = $.parseJSON(iframe_cont.contents().find('body').html());
                iframe_cont.unbind('load');
                iframe_cont.remove(); /* Delete iframe */
                
                /* Process return info */
                if(return_info.status == 'error') {
                    /* Error */
                    info._update_queue_status(item_id, queue_id, 'error', return_info.info);

                    /* Remove queue */
                    info._remove_queue_item(item_id, queue_id);

                    /* Remove data */
                    info._remove_data_item(item_id);
                } else { 
                    /* Success */
                    info._update_queue_status(item_id, queue_id, 'success', 'Success!');

                    /* Set variable */
                    var thumbnail = return_info.file;

                    /* Remove queue display */
                    info._remove_queue_item(item_id, queue_id);

                    /* Add file info to data item */
                    info.data.items[item_id].orig_image.name = return_info.file.name;
                    info.data.items[item_id].orig_image.path = return_info.file.path;
                    info.data.items[item_id].orig_image.size = return_info.file.size;
                    info.data.items[item_id].orig_image.height = return_info.file.height;
                    info.data.items[item_id].orig_image.width = return_info.file.width;
                    info.data.items[item_id].orig_image.type = return_info.file.type;

                    /* Check for thumbnail */
                    if(return_info.thumbnail) {
                        /* Add file info to data item thumbnail */
                        info.data.items[item_id].thumb_image.name = return_info.thumbnail.name;
                        info.data.items[item_id].thumb_image.path = return_info.thumbnail.path;
                        info.data.items[item_id].thumb_image.size = return_info.thumbnail.size;
                        info.data.items[item_id].thumb_image.height = return_info.thumbnail.height;
                        info.data.items[item_id].thumb_image.width = return_info.thumbnail.width;
                        info.data.items[item_id].thumb_image.type = return_info.thumbnail.type;

                        /* thumbnail will use thumbnail appose to orig image */
                        thumbnail = return_info.thumbnail;
                    }

                    /* If crop add image and initiate jcrop */
                    if(info.options.crop && (info.options.crop_force || !info.options.multiple)) {
                        info._crop_start(item_id, return_info.file, false);
                    } else {
                        /* Change data input_path */
                        info._update_data_item_input_path(item_id, return_info.file.path);

                        /* If no crop finalize upload and add hidden input field to final div location */
                        info._add_image_input(item_id);

                        /* Add thumbnail */
                        info._add_image_thumbnail(item_id, thumbnail);
                    }
                }
            });
        },
        /**********************/
        /*** Crop functions ***/
        /**********************/
        _crop_start: function(item_id, image, update) {
            var info = this;
            var crop_image_id = info._unique_id();
            var desc_width, desc_height, title_height;
            var cont_padding = 50;
            var window_width = $(window).width();
            var window_height = $(window).height();
            var img_ratio, img_width, img_height, cont_width, cont_height;
            var crop_coords;

            /* Add crop container */
            var crop_cont = '';
            crop_cont += '<div class="uc_crop_overlay">';
            crop_cont += '  <div class="uc_crop_cont">'
            crop_cont += '      <div class="uc_crop_title">'+info.options.crop_title+'<div class="uc_crop_close">X</div></div>';
            crop_cont += '      <div class="uc_crop_img"><img id="'+crop_image_id+'" src="'+image.path+'" /></div>'; /* Add Image */
            crop_cont += '      <div class="uc_crop_desc">';
            crop_cont += '          <div class="uc_crop_preview"><div><img src="'+image.path+'" /></div></div>'; /* Crop preview */
            crop_cont += '          <div class="uc_crop_preview_text">Preview</div>';
            crop_cont += '          <div class="upcut_btn upcut_btn_crop upcut_crop_none">Use Full Image</div>';
            crop_cont += '          <div class="upcut_btn upcut_btn_crop upcut_crop_submit">Submit Crop</div>';
            crop_cont += '          <div class="uc_crop_img_info"></div>';
            crop_cont += '      </div>';
            crop_cont += '  </div>';
            crop_cont += '</div>';
            info.data.main_cont.find('.upcut_crop').html(crop_cont);

            /* Set height width variables - based upon fitting window size */
            desc_width = info.data.main_cont.find('.uc_crop_overlay .uc_crop_desc').outerWidth(true);
            desc_height = info.data.main_cont.find('.uc_crop_overlay .uc_crop_desc').outerHeight(true);
            title_height = info.data.main_cont.find('.uc_crop_overlay .uc_crop_title').outerHeight(true);

            /* Get aspect ratio */
            if(image.width > image.height) {
                img_ratio = image.height / image.width;
                img_width = (image.width + desc_width + cont_padding > window_width ? window_width - desc_width - cont_padding : image.width);
                img_height = img_width * img_ratio;
                if(img_height + title_height + cont_padding > window_height) {
                    img_height = (image.height + title_height + cont_padding > window_height ? window_height - title_height - cont_padding : image.height);
                    img_width = img_height / img_ratio;
                }
            } else {
                img_ratio = image.width / image.height;
                img_height = (image.height + title_height + cont_padding > window_height ? window_height - title_height - cont_padding : image.height);
                img_width = img_height * img_ratio;
                if(img_width + desc_width + cont_padding > window_width) {
                    img_width = (image.width + desc_width + cont_padding > window_width ? window_width - desc_width - cont_padding : image.width);
                    img_height = img_width / img_ratio;
                }
            }

            /* Set image size */
            info.data.main_cont.find('.upcut_crop .uc_crop_cont .uc_crop_img img').css({
                width: img_width + 'px',
                height: img_height + 'px'
            });

            /* Set container size */
            cont_width = img_width + desc_width + 1; /* Minor fix, had issue with desc being dropped under img */
            cont_height = (img_height <= desc_height ? desc_height + title_height : img_height + title_height);
            info.data.main_cont.find('.upcut_crop .uc_crop_cont').css({
                width: cont_width + 'px',
                height: cont_height + 'px'
            });

            /* Set Select - If update is true and coords are set */
            if(update && info.data.items[item_id].crop_image.coords.x !== false) {
                var crop_set_select = [
                    info.data.items[item_id].crop_image.coords.x,
                    info.data.items[item_id].crop_image.coords.y,
                    (info.data.items[item_id].crop_image.coords.x + info.data.items[item_id].crop_image.coords.w),
                    (info.data.items[item_id].crop_image.coords.y + info.data.items[item_id].crop_image.coords.h)
                ];
            } else {
                var crop_set_select = [(image.width / 2 - 100),(image.height / 2 - 100),(image.width / 2 + 100),(image.height / 2 + 100)];
            }

            /* Set preview variables */
            var preview_cont = info.data.main_cont.find('.uc_crop_overlay .uc_crop_desc .uc_crop_preview');
            var preview_div = preview_cont.find('div');
            var preview_img = preview_div.find('img');
            var preview_max_width = preview_cont.width();
            var preview_max_height = preview_cont.height();
            
            /* Add jcrop */
            info.data.main_cont.find('#'+crop_image_id).Jcrop({
                onChange: crop_preview,
                onSelect: crop_preview,
                aspectRatio: (info.options.crop_square ? 1 : 0),
                setSelect: crop_set_select,
                trueSize: [image.width,image.height], /* Actual size of original image */
                bgOpacity: .4
            },function(){
                /* var jcrop = this; */
            });

            /* Set preview crop coords */
            function crop_preview(coords) {
                /* If no coords then return */
                if (parseInt(coords.w) <= 0 || parseInt(coords.h) <= 0) return;

                /* Set crop coordinates */
                crop_coords = coords;

                /* Set ratios and scales */
                var crop_ratio = (coords.w / coords.h);
                var inner_width = crop_ratio >= (preview_max_width / preview_max_height) ? preview_max_width : preview_max_height * crop_ratio;
                var inner_height = crop_ratio < (preview_max_width / preview_max_height) ? preview_max_height : preview_max_width / crop_ratio;
                var scalex = inner_width / coords.w;
                var scaley = inner_height / coords.h;
                /* Style preview div */
                preview_div.css({
                    width: Math.ceil(inner_width) + 'px',
                    height: Math.ceil(inner_height) + 'px',
                    marginTop: (preview_max_height - inner_height) / 2 + 'px',
                    marginLeft: (preview_max_width - inner_width) / 2 + 'px',
                    overflow: 'hidden'
                });
                /* Style preview image */
                preview_img.css({
                    width: Math.round(scalex * image.width) + 'px', /* Grab original image width */
                    height: Math.round(scaley * image.height) + 'px', /* Grab original image height */
                    marginLeft: '-' + Math.round(scalex * coords.x) + 'px',
                    marginTop: '-' + Math.round(scaley * coords.y) + 'px'
                });
            }

            /* Add event listener for close */
            info.data.main_cont.find('.uc_crop_overlay .uc_crop_close').click(function(){
                info._crop_remove();

                /* Remove data item */
                if(!update) {
                    info._remove_data_item(item_id);
                }
            });

            /* Add event listener for not needing to crop and using original image */
            info.data.main_cont.find('.uc_crop_overlay .uc_crop_desc .upcut_crop_none').click(function() {
                /* Change data input_path */
                info._update_data_item_input_path(item_id, info.data.items[item_id].orig_image.path);

                /* Check if we need to update */
                if(update) {
                    /* Update thumbnail */
                    info._update_image_thumbnail(item_id, info.data.items[item_id].thumbnail.id, image);
                } else {
                    /* Add thumbnail */
                    info._add_image_thumbnail(item_id, image);
                }

                /* Clear out crop data */
                info.data.items[item_id].crop_image = jQuery.extend({}, info.data.image_array);
                info.data.items[item_id].crop_image.coords = jQuery.extend({}, info.data.image_coords);

                /* Add input field */
                info._add_image_input(item_id);

                /* Close and remove crop */
                info._crop_remove();
            });

            /* Add event listener for crop submit */
            info.data.main_cont.find('.uc_crop_overlay .uc_crop_desc .upcut_crop_submit').click(function() {
                info._crop_submit(item_id, image, crop_coords, (update ? true: false));
            });
        },
        _crop_submit: function(item_id, image_info, coords, update) {
            var info = this;

            if(info.options.crop_url) {
                $.ajax({
                    type: 'POST',
                    url: info.options.crop_url,
                    data: info.options.upload_name+'='+image_info.name+'&'+info.options.upload_name+'_path='+image_info.path+'&x='+coords.x+'&y='+coords.y+'&w='+coords.w+'&h='+coords.h,
                    success: function(results) {
                        /* Validate json string */
                        if(!info._validate_json_str(results)) {
                            /* Add error */
                            info._add_error('crop_submit', 'Return info was not a proper json string');

                            /* Close and remove crop */
                            info._crop_remove();

                            /* Show error message */
                            info._general_message('error', 'There was a problem cropping image');
                            return;
                        }

                        /* Grab results data */
                        var return_info = $.parseJSON(results);
                        if(return_info.status == 'success') {
                            /* Change data input_path */
                            info._update_data_item_input_path(item_id, return_info.file.path);

                            var thumbnail = return_info.file;

                            /* Add file info to data item crop */
                            info.data.items[item_id].crop_image.name = return_info.file.name;
                            info.data.items[item_id].crop_image.path = return_info.file.path;
                            info.data.items[item_id].crop_image.size = return_info.file.size;
                            info.data.items[item_id].crop_image.height = return_info.file.height;
                            info.data.items[item_id].crop_image.width = return_info.file.width;
                            info.data.items[item_id].crop_image.type = return_info.file.type;
                            info.data.items[item_id].crop_image.coords = coords;

                            /* Add input field */
                            info._add_image_input(item_id);

                            /* Check for thumbnail */
                            if(return_info.thumbnail) {
                                /* Add file info to data item thumbnail */
                                info.data.items[item_id].thumb_image.name = return_info.thumbnail.name;
                                info.data.items[item_id].thumb_image.path = return_info.thumbnail.path;
                                info.data.items[item_id].thumb_image.size = return_info.thumbnail.size;
                                info.data.items[item_id].thumb_image.height = return_info.thumbnail.height;
                                info.data.items[item_id].thumb_image.width = return_info.thumbnail.width;
                                info.data.items[item_id].thumb_image.type = return_info.thumbnail.type;

                                /* thumbnail will use thumbnail appose to crop image */
                                thumbnail = return_info.thumbnail;
                            }

                            if(update) {
                                /* Update thumbnail */
                                info._update_image_thumbnail(item_id, info.data.items[item_id].thumbnail.id, thumbnail);
                            } else {
                                /* Add thumbnail */
                                info._add_image_thumbnail(item_id, thumbnail);
                            }

                            /* Close and remove crop */
                            info._crop_remove();
                        } else {
                            info._add_error('crop_submit', return_info.info);
                        }
                    }
                });
            } else {
                /* Crop url was not set */
                info._add_error('crop_submit', 'Crop Url was not set');
            }
        },
        _crop_remove: function() {
            var info = this;

            info.data.main_cont.find('.uc_crop_overlay').remove();
        },
        /**********************/
        /*** Misc functions ***/
        /**********************/
        _unique_id: function() {
            var unique_id = 'uc_'+new Date().getTime();

            while ($('#'+unique_id).length) {
                unique_id = 'uc_'+new Date().getTime();
            }

            return unique_id;
        },
        _check_html5: function() {
        	var info = this;
        	if (!window.FormData) {
				info.options.html5 = true;
            }
        },
        _object_length: function(object) {
            var count = 0;

            for (i in object) {
                if (object.hasOwnProperty(i)) {
                    count++;
                }
            }

            return count;
        },
        _minimize_file_name: function(text, limit) {
            if(text.length <= limit) {
                return text;
            } else {
                return text.substring(0, limit)+'...';
            }
        },
        _size_in_text: function (bytes) {
            if(bytes == 0){return false;}

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
        _get_file_name_from_path: function(file_path) {
            return file_path.replace(/^.*[\\\/]/, '');
        },
        _get_file_type: function(file) {
            return file.name.substr(file.name.lastIndexOf('.')+1);
        },
        /* Validate file functions */
        _validate_file: function(file) {
            var info = this;
            var valid = true;
            /* Make sure its a valid file type */
            if(!info._validate_file_type(file)){
                info._add_error('file_type', 'Invalid file type');
                valid = 'Invalid file type';
            }
            /* Make sure it doesnt exceed file size */
            if(!info._validate_file_size(file)) {
                info._add_error('file_size', 'Exceeded max file size of '+info._size_in_text(info.options.max_file_size));
                valid = 'Exceeded max file size of '+info._size_in_text(info.options.max_file_size);
            }
            return valid;
        },
        _validate_file_type: function(file) {
            var info = this;
            var name = file.name;
            var ext = info._get_file_type(file);
            if($.inArray(ext, info.options.file_types) == -1) {
                /* Add error to array */
                info._add_error('file_type', 'Not a valid image file. Allowed image types: '+info.options.file_types.join(', '));
                return false;
            }
            if($.inArray(ext, info.data.image_types) == -1) {
                /* Add error to array */
                info._add_error('file_type', 'Not even a image file. General image types: '+info.data.image_types.join(', '));
                return false;
            }
            return true;
        },
        _validate_file_size: function(file) {
            var info = this;
            if(file.size > info.options.max_file_size) {
                /* Add error to array */
                info._add_error('file_size', 'Exceeded file size. Max file size is: '+info._size_in_text(info.options.max_file_size));
                return false;
            }
            return true;
        },
        _validate_return_data: function(return_info) {
            var info = this;
            if(!return_info.name || !return_info.path || !return_info.size || !return_info.height || !return_info.width || !return_info.type) {
                info._general_message('error', 'Must send all file info data: name, path, size, height, width and type');
                return false;
            }
            return true;
        },
        _validate_json_str: function(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
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
                $.error('Method ' +  options + ' does not exist in Upper Cut');
            }
        });
    };

})(jQuery);

/* IE 8, 7 Compatibility */
if(typeof Object.create !== 'function'){
    Object.create = function(obj) {
        function F(){};
        F.prototype = obj;
        return new F();
    };
}



/**
 * jquery.Jcrop.min.js v0.9.10 (build:20120429)
 * jQuery Image Cropping Plugin - released under MIT License
 * Copyright (c) 2008-2012 Tapmodo Interactive LLC
 * https://github.com/tapmodo/Jcrop
 */
(function(a){a.Jcrop=function(b,c){function h(a){return a+"px"}function i(a){return d.baseClass+"-"+a}function j(){return a.fx.step.hasOwnProperty("backgroundColor")}function k(b){var c=a(b).offset();return[c.left,c.top]}function l(a){return[a.pageX-e[0],a.pageY-e[1]]}function m(b){typeof b!="object"&&(b={}),d=a.extend(d,b),a.each(["onChange","onSelect","onRelease","onDblClick"],function(a,b){typeof d[b]!="function"&&(d[b]=function(){})})}function n(a,b){e=k(E),bd.setCursor(a==="move"?a:a+"-resize");if(a==="move")return bd.activateHandlers(p(b),u);var c=ba.getFixed(),d=q(a),f=ba.getCorner(q(d));ba.setPressed(ba.getCorner(d)),ba.setCurrent(f),bd.activateHandlers(o(a,c),u)}function o(a,b){return function(c){if(!d.aspectRatio)switch(a){case"e":c[1]=b.y2;break;case"w":c[1]=b.y2;break;case"n":c[0]=b.x2;break;case"s":c[0]=b.x2}else switch(a){case"e":c[1]=b.y+1;break;case"w":c[1]=b.y+1;break;case"n":c[0]=b.x+1;break;case"s":c[0]=b.x+1}ba.setCurrent(c),bc.update()}}function p(a){var b=a;return be.watchKeys(),function(
a){ba.moveOffset([a[0]-b[0],a[1]-b[1]]),b=a,bc.update()}}function q(a){switch(a){case"n":return"sw";case"s":return"nw";case"e":return"nw";case"w":return"ne";case"ne":return"sw";case"nw":return"se";case"se":return"nw";case"sw":return"ne"}}function r(a){return function(b){return d.disabled?!1:a==="move"&&!d.allowMove?!1:(e=k(E),X=!0,n(a,l(b)),b.stopPropagation(),b.preventDefault(),!1)}}function s(a,b,c){var d=a.width(),e=a.height();d>b&&b>0&&(d=b,e=b/a.width()*a.height()),e>c&&c>0&&(e=c,d=c/a.height()*a.width()),U=a.width()/d,V=a.height()/e,a.width(d).height(e)}function t(a){return{x:a.x*U,y:a.y*V,x2:a.x2*U,y2:a.y2*V,w:a.w*U,h:a.h*V}}function u(a){var b=ba.getFixed();b.w>d.minSelect[0]&&b.h>d.minSelect[1]?(bc.enableHandles(),bc.done()):bc.release(),bd.setCursor(d.allowSelect?"crosshair":"default")}function v(a){if(d.disabled)return!1;if(!d.allowSelect)return!1;X=!0,e=k(E),bc.disableHandles(),bd.setCursor("crosshair");var b=l(a);return ba.setPressed(b),bc.update(),bd.activateHandlers(w,u),be.watchKeys(),a.stopPropagation
(),a.preventDefault(),!1}function w(a){ba.setCurrent(a),bc.update()}function z(){var b=a("<div></div>").addClass(i("tracker"));return a.browser.msie&&b.css({opacity:0,backgroundColor:"white"}),b}function bf(a){H.removeClass().addClass(i("holder")).addClass(a)}function bg(a,b){function t(){window.setTimeout(u,l)}var c=a[0]/U,e=a[1]/V,f=a[2]/U,g=a[3]/V;if(Y)return;var h=ba.flipCoords(c,e,f,g),i=ba.getFixed(),j=[i.x,i.y,i.x2,i.y2],k=j,l=d.animationDelay,m=h[0]-j[0],n=h[1]-j[1],o=h[2]-j[2],p=h[3]-j[3],q=0,r=d.swingSpeed;x=k[0],y=k[1],f=k[2],g=k[3],bc.animMode(!0);var s,u=function(){return function(){q+=(100-q)/r,k[0]=x+q/100*m,k[1]=y+q/100*n,k[2]=f+q/100*o,k[3]=g+q/100*p,q>=99.8&&(q=100),q<100?(bi(k),t()):(bc.done(),typeof b=="function"&&b.call(bt))}}();t()}function bh(a){bi([a[0]/U,a[1]/V,a[2]/U,a[3]/V]),d.onSelect.call(bt,t(ba.getFixed())),bc.enableHandles()}function bi(a){ba.setPressed([a[0],a[1]]),ba.setCurrent([a[2],a[3]]),bc.update()}function bj(){return t(ba.getFixed())}function bk(){return ba.getFixed()}function bl
(a){m(a),bs()}function bm(){d.disabled=!0,bc.disableHandles(),bc.setCursor("default"),bd.setCursor("default")}function bn(){d.disabled=!1,bs()}function bo(){bc.done(),bd.activateHandlers(null,null)}function bp(){H.remove(),B.show(),a(b).removeData("Jcrop")}function bq(a,b){bc.release(),bm();var c=new Image;c.onload=function(){var e=c.width,f=c.height,g=d.boxWidth,h=d.boxHeight;E.width(e).height(f),E.attr("src",a),I.attr("src",a),s(E,g,h),F=E.width(),G=E.height(),I.width(F).height(G),N.width(F+M*2).height(G+M*2),H.width(F).height(G),bb.resize(F,G),bn(),typeof b=="function"&&b.call(bt)},c.src=a}function br(a,b,c){var e=b||d.bgColor;d.bgFade&&j()&&d.fadeTime&&!c?a.animate({backgroundColor:e},{queue:!1,duration:d.fadeTime}):a.css("backgroundColor",e)}function bs(a){d.allowResize?a?bc.enableOnly():bc.enableHandles():bc.disableHandles(),bd.setCursor(d.allowSelect?"crosshair":"default"),bc.setCursor(d.allowMove?"move":"default"),d.hasOwnProperty("trueSize")&&(U=d.trueSize[0]/F,V=d.trueSize[1]/G),d.hasOwnProperty("setSelect"
)&&(bh(d.setSelect),bc.done(),delete d.setSelect),bb.refresh(),d.bgColor!=O&&(br(d.shade?bb.getShades():H,d.shade?d.shadeColor||d.bgColor:d.bgColor),O=d.bgColor),P!=d.bgOpacity&&(P=d.bgOpacity,d.shade?bb.refresh():bc.setBgOpacity(P)),Q=d.maxSize[0]||0,R=d.maxSize[1]||0,S=d.minSize[0]||0,T=d.minSize[1]||0,d.hasOwnProperty("outerImage")&&(E.attr("src",d.outerImage),delete d.outerImage),bc.refresh()}var d=a.extend({},a.Jcrop.defaults),e,f,g=!1;a.browser.msie&&a.browser.version.split(".")[0]==="6"&&(g=!0),typeof b!="object"&&(b=a(b)[0]),typeof c!="object"&&(c={}),m(c);var A={border:"none",visibility:"visible",margin:0,padding:0,position:"absolute",top:0,left:0},B=a(b),C=!0;if(b.tagName=="IMG"){if(B[0].width!=0&&B[0].height!=0)B.width(B[0].width),B.height(B[0].height);else{var D=new Image;D.src=B[0].src,B.width(D.width),B.height(D.height)}var E=B.clone().removeAttr("id").css(A).show();E.width(B.width()),E.height(B.height()),B.after(E).hide()}else E=B.css(A).show(),C=!1,d.shade===null&&(d.shade=!0);s(E,d.boxWidth,d.
boxHeight);var F=E.width(),G=E.height(),H=a("<div />").width(F).height(G).addClass(i("holder")).css({position:"relative",backgroundColor:d.bgColor}).insertAfter(B).append(E);d.addClass&&H.addClass(d.addClass);var I=a("<div />"),J=a("<div />").width("100%").height("100%").css({zIndex:310,position:"absolute",overflow:"hidden"}),K=a("<div />").width("100%").height("100%").css("zIndex",320),L=a("<div />").css({position:"absolute",zIndex:600}).dblclick(function(){var a=ba.getFixed();d.onDblClick.call(bt,a)}).insertBefore(E).append(J,K);C&&(I=a("<img />").attr("src",E.attr("src")).css(A).width(F).height(G),J.append(I)),g&&L.css({overflowY:"hidden"});var M=d.boundary,N=z().width(F+M*2).height(G+M*2).css({position:"absolute",top:h(-M),left:h(-M),zIndex:290}).mousedown(v),O=d.bgColor,P=d.bgOpacity,Q,R,S,T,U,V,W=!0,X,Y,Z;e=k(E);var _=function(){function a(){var a={},b=["touchstart","touchmove","touchend"],c=document.createElement("div"),d;try{for(d=0;d<b.length;d++){var e=b[d];e="on"+e;var f=e in c;f||(c.setAttribute(e,"return;"
),f=typeof c[e]=="function"),a[b[d]]=f}return a.touchstart&&a.touchend&&a.touchmove}catch(g){return!1}}function b(){return d.touchSupport===!0||d.touchSupport===!1?d.touchSupport:a()}return{createDragger:function(a){return function(b){return b.pageX=b.originalEvent.changedTouches[0].pageX,b.pageY=b.originalEvent.changedTouches[0].pageY,d.disabled?!1:a==="move"&&!d.allowMove?!1:(X=!0,n(a,l(b)),b.stopPropagation(),b.preventDefault(),!1)}},newSelection:function(a){return a.pageX=a.originalEvent.changedTouches[0].pageX,a.pageY=a.originalEvent.changedTouches[0].pageY,v(a)},isSupported:a,support:b()}}(),ba=function(){function h(d){d=n(d),c=a=d[0],e=b=d[1]}function i(a){a=n(a),f=a[0]-c,g=a[1]-e,c=a[0],e=a[1]}function j(){return[f,g]}function k(d){var f=d[0],g=d[1];0>a+f&&(f-=f+a),0>b+g&&(g-=g+b),G<e+g&&(g+=G-(e+g)),F<c+f&&(f+=F-(c+f)),a+=f,c+=f,b+=g,e+=g}function l(a){var b=m();switch(a){case"ne":return[b.x2,b.y];case"nw":return[b.x,b.y];case"se":return[b.x2,b.y2];case"sw":return[b.x,b.y2]}}function m(){if(!d.aspectRatio
)return p();var f=d.aspectRatio,g=d.minSize[0]/U,h=d.maxSize[0]/U,i=d.maxSize[1]/V,j=c-a,k=e-b,l=Math.abs(j),m=Math.abs(k),n=l/m,r,s,t,u;return h===0&&(h=F*10),i===0&&(i=G*10),n<f?(s=e,t=m*f,r=j<0?a-t:t+a,r<0?(r=0,u=Math.abs((r-a)/f),s=k<0?b-u:u+b):r>F&&(r=F,u=Math.abs((r-a)/f),s=k<0?b-u:u+b)):(r=c,u=l/f,s=k<0?b-u:b+u,s<0?(s=0,t=Math.abs((s-b)*f),r=j<0?a-t:t+a):s>G&&(s=G,t=Math.abs(s-b)*f,r=j<0?a-t:t+a)),r>a?(r-a<g?r=a+g:r-a>h&&(r=a+h),s>b?s=b+(r-a)/f:s=b-(r-a)/f):r<a&&(a-r<g?r=a-g:a-r>h&&(r=a-h),s>b?s=b+(a-r)/f:s=b-(a-r)/f),r<0?(a-=r,r=0):r>F&&(a-=r-F,r=F),s<0?(b-=s,s=0):s>G&&(b-=s-G,s=G),q(o(a,b,r,s))}function n(a){return a[0]<0&&(a[0]=0),a[1]<0&&(a[1]=0),a[0]>F&&(a[0]=F),a[1]>G&&(a[1]=G),[a[0],a[1]]}function o(a,b,c,d){var e=a,f=c,g=b,h=d;return c<a&&(e=c,f=a),d<b&&(g=d,h=b),[e,g,f,h]}function p(){var d=c-a,f=e-b,g;return Q&&Math.abs(d)>Q&&(c=d>0?a+Q:a-Q),R&&Math.abs(f)>R&&(e=f>0?b+R:b-R),T/V&&Math.abs(f)<T/V&&(e=f>0?b+T/V:b-T/V),S/U&&Math.abs(d)<S/U&&(c=d>0?a+S/U:a-S/U),a<0&&(c-=a,a-=a),b<0&&(e-=b,b-=b),c<0&&
(a-=c,c-=c),e<0&&(b-=e,e-=e),c>F&&(g=c-F,a-=g,c-=g),e>G&&(g=e-G,b-=g,e-=g),a>F&&(g=a-G,e-=g,b-=g),b>G&&(g=b-G,e-=g,b-=g),q(o(a,b,c,e))}function q(a){return{x:a[0],y:a[1],x2:a[2],y2:a[3],w:a[2]-a[0],h:a[3]-a[1]}}var a=0,b=0,c=0,e=0,f,g;return{flipCoords:o,setPressed:h,setCurrent:i,getOffset:j,moveOffset:k,getCorner:l,getFixed:m}}(),bb=function(){function f(a,b){e.left.css({height:h(b)}),e.right.css({height:h(b)})}function g(){return i(ba.getFixed())}function i(a){e.top.css({left:h(a.x),width:h(a.w),height:h(a.y)}),e.bottom.css({top:h(a.y2),left:h(a.x),width:h(a.w),height:h(G-a.y2)}),e.right.css({left:h(a.x2),width:h(F-a.x2)}),e.left.css({width:h(a.x)})}function j(){return a("<div />").css({position:"absolute",backgroundColor:d.shadeColor||d.bgColor}).appendTo(c)}function k(){b||(b=!0,c.insertBefore(E),g(),bc.setBgOpacity(1,0,1),I.hide(),l(d.shadeColor||d.bgColor,1),bc.isAwake()?n(d.bgOpacity,1):n(1,1))}function l(a,b){br(p(),a,b)}function m(){b&&(c.remove(),I.show(),b=!1,bc.isAwake()?bc.setBgOpacity(d.bgOpacity
,1,1):(bc.setBgOpacity(1,1,1),bc.disableHandles()),br(H,0,1))}function n(a,e){b&&(d.bgFade&&!e?c.animate({opacity:1-a},{queue:!1,duration:d.fadeTime}):c.css({opacity:1-a}))}function o(){d.shade?k():m(),bc.isAwake()&&n(d.bgOpacity)}function p(){return c.children()}var b=!1,c=a("<div />").css({position:"absolute",zIndex:240,opacity:0}),e={top:j(),left:j().height(G),right:j().height(G),bottom:j()};return{update:g,updateRaw:i,getShades:p,setBgColor:l,enable:k,disable:m,resize:f,refresh:o,opacity:n}}(),bc=function(){function k(b){var c=a("<div />").css({position:"absolute",opacity:d.borderOpacity}).addClass(i(b));return J.append(c),c}function l(b,c){var d=a("<div />").mousedown(r(b)).css({cursor:b+"-resize",position:"absolute",zIndex:c}).addClass("ord-"+b);return _.support&&d.bind("touchstart.jcrop",_.createDragger(b)),K.append(d),d}function m(a){var b=d.handleSize;return l(a,c++).css({opacity:d.handleOpacity}).width(b).height(b).addClass(i("handle"))}function n(a){return l(a,c++).addClass("jcrop-dragbar")}function o
(a){var b;for(b=0;b<a.length;b++)g[a[b]]=n(a[b])}function p(a){var b,c;for(c=0;c<a.length;c++){switch(a[c]){case"n":b="hline";break;case"s":b="hline bottom";break;case"e":b="vline right";break;case"w":b="vline"}e[a[c]]=k(b)}}function q(a){var b;for(b=0;b<a.length;b++)f[a[b]]=m(a[b])}function s(a,b){d.shade||I.css({top:h(-b),left:h(-a)}),L.css({top:h(b),left:h(a)})}function u(a,b){L.width(a).height(b)}function v(){var a=ba.getFixed();ba.setPressed([a.x,a.y]),ba.setCurrent([a.x2,a.y2]),w()}function w(a){if(b)return x(a)}function x(a){var c=ba.getFixed();u(c.w,c.h),s(c.x,c.y),d.shade&&bb.updateRaw(c),b||A(),a?d.onSelect.call(bt,t(c)):d.onChange.call(bt,t(c))}function y(a,c,e){if(!b&&!c)return;d.bgFade&&!e?E.animate({opacity:a},{queue:!1,duration:d.fadeTime}):E.css("opacity",a)}function A(){L.show(),d.shade?bb.opacity(P):y(P,!0),b=!0}function B(){F(),L.hide(),d.shade?bb.opacity(1):y(1),b=!1,d.onRelease.call(bt)}function C(){j&&K.show()}function D(){j=!0;if(d.allowResize)return K.show(),!0}function F(){j=!1,K.hide(
)}function G(a){Y===a?F():D()}function H(){G(!1),v()}var b,c=370,e={},f={},g={},j=!1;d.dragEdges&&a.isArray(d.createDragbars)&&o(d.createDragbars),a.isArray(d.createHandles)&&q(d.createHandles),d.drawBorders&&a.isArray(d.createBorders)&&p(d.createBorders),a(document).bind("touchstart.jcrop-ios",function(b){a(b.currentTarget).hasClass("jcrop-tracker")&&b.stopPropagation()});var M=z().mousedown(r("move")).css({cursor:"move",position:"absolute",zIndex:360});return _.support&&M.bind("touchstart.jcrop",_.createDragger("move")),J.append(M),F(),{updateVisible:w,update:x,release:B,refresh:v,isAwake:function(){return b},setCursor:function(a){M.css("cursor",a)},enableHandles:D,enableOnly:function(){j=!0},showHandles:C,disableHandles:F,animMode:G,setBgOpacity:y,done:H}}(),bd=function(){function f(){N.css({zIndex:450}),_.support&&a(document).bind("touchmove.jcrop",k).bind("touchend.jcrop",m),e&&a(document).bind("mousemove.jcrop",h).bind("mouseup.jcrop",i)}function g(){N.css({zIndex:290}),a(document).unbind(".jcrop")}function h
(a){return b(l(a)),!1}function i(a){return a.preventDefault(),a.stopPropagation(),X&&(X=!1,c(l(a)),bc.isAwake()&&d.onSelect.call(bt,t(ba.getFixed())),g(),b=function(){},c=function(){}),!1}function j(a,d){return X=!0,b=a,c=d,f(),!1}function k(a){return a.pageX=a.originalEvent.changedTouches[0].pageX,a.pageY=a.originalEvent.changedTouches[0].pageY,h(a)}function m(a){return a.pageX=a.originalEvent.changedTouches[0].pageX,a.pageY=a.originalEvent.changedTouches[0].pageY,i(a)}function n(a){N.css("cursor",a)}var b=function(){},c=function(){},e=d.trackDocument;return e||N.mousemove(h).mouseup(i).mouseout(i),E.before(N),{activateHandlers:j,setCursor:n}}(),be=function(){function e(){d.keySupport&&(b.show(),b.focus())}function f(a){b.hide()}function h(a,b,c){d.allowMove&&(ba.moveOffset([b,c]),bc.updateVisible(!0)),a.preventDefault(),a.stopPropagation()}function i(a){if(a.ctrlKey||a.metaKey)return!0;Z=a.shiftKey?!0:!1;var b=Z?10:1;switch(a.keyCode){case 37:h(a,-b,0);break;case 39:h(a,b,0);break;case 38:h(a,0,-b);break;case 40
:h(a,0,b);break;case 27:d.allowSelect&&bc.release();break;case 9:return!0}return!1}var b=a('<input type="radio" />').css({position:"fixed",left:"-120px",width:"12px"}),c=a("<div />").css({position:"absolute",overflow:"hidden"}).append(b);return d.keySupport&&(b.keydown(i).blur(f),g||!d.fixedSupport?(b.css({position:"absolute",left:"-20px"}),c.append(b).insertBefore(E)):b.insertBefore(E)),{watchKeys:e}}();_.support&&N.bind("touchstart.jcrop",_.newSelection),K.hide(),bs(!0);var bt={setImage:bq,animateTo:bg,setSelect:bh,setOptions:bl,tellSelect:bj,tellScaled:bk,setClass:bf,disable:bm,enable:bn,cancel:bo,release:bc.release,destroy:bp,focus:be.watchKeys,getBounds:function(){return[F*U,G*V]},getWidgetSize:function(){return[F,G]},getScaleFactor:function(){return[U,V]},getOptions:function(){return d},ui:{holder:H,selection:L}};return a.browser.msie&&H.bind("selectstart",function(){return!1}),B.data("Jcrop",bt),bt},a.fn.Jcrop=function(b,c){var d;return this.each(function(){if(a(this).data("Jcrop")){if(b==="api")return a
(this).data("Jcrop");a(this).data("Jcrop").setOptions(b)}else this.tagName=="IMG"?a.Jcrop.Loader(this,function(){a(this).css({display:"block",visibility:"hidden"}),d=a.Jcrop(this,b),a.isFunction(c)&&c.call(d)}):(a(this).css({display:"block",visibility:"hidden"}),d=a.Jcrop(this,b),a.isFunction(c)&&c.call(d))}),this},a.Jcrop.Loader=function(b,c,d){function g(){f.complete?(e.unbind(".jcloader"),a.isFunction(c)&&c.call(f)):window.setTimeout(g,50)}var e=a(b),f=e[0];e.bind("load.jcloader",g).bind("error.jcloader",function(b){e.unbind(".jcloader"),a.isFunction(d)&&d.call(f)}),f.complete&&a.isFunction(c)&&(e.unbind(".jcloader"),c.call(f))},a.Jcrop.defaults={allowSelect:!0,allowMove:!0,allowResize:!0,trackDocument:!0,baseClass:"jcrop",addClass:null,bgColor:"black",bgOpacity:.6,bgFade:!1,borderOpacity:.4,handleOpacity:.5,handleSize:7,aspectRatio:0,keySupport:!0,createHandles:["n","s","e","w","nw","ne","se","sw"],createDragbars:["n","s","e","w"],createBorders:["n","s","e","w"],drawBorders:!0,dragEdges:!0,fixedSupport:!0,
touchSupport:null,shade:null,boxWidth:0,boxHeight:0,boundary:2,fadeTime:400,animationDelay:20,swingSpeed:3,minSelect:[0,0],maxSize:[0,0],minSize:[0,0],onChange:function(){},onSelect:function(){},onDblClick:function(){},onRelease:function(){}}})(jQuery);