<?php

if ($_GET['which'] == 'upload') {
    upload();
}
if ($_GET['which'] == 'crop') {
    crop();
}

function upload() {
    // Options
    $allowed_types = array('jpg', 'jpeg', 'pjpeg', 'gif', 'bmp', 'png', 'x-png'); // Allowed file types
    $max_size = 10 * (1024 * 1024); // Maximum filesize in bytes (currently 10MB).
    $upload_path = 'images/uploads/'; // Upload location - trailing slash

    // Should we send back a thumbnail
    $thumbnail = true;

    // Return info
    $return_info = array(
        'status' => '',
        'file' => array(
            'name' => '',
            'path' => '',
            'size' => '',
            'height' => '',
            'width' => '',
            'type' => ''
        ),
        'info' => ''
    );

    // File Info
    $name = $_POST['post_name'];
    $file_name = $_FILES[$name]['name'];
    $file_temp = $_FILES[$name]['tmp_name'];
    $file_size = $_FILES[$name]['size'];
    $file_height = 0;
    $file_width = 0;
    $file_type = $_FILES[$name]['type'];
    if ($file_type) {
        $file_type = explode('/', $file_type);
        $file_type = $file_type[1];
    } else {
        $file_type = substr(strrchr($file_name, '.'), 1);
    }
    $file_path = $upload_path . $file_name;

    // Validate
    if (!in_array($file_type, $allowed_types)) { // Check file types
        $return_info['status'] = 'error';
        $return_info['info'] = 'File type is not allowed';
    }
    if (filesize($file_temp) > $max_size) { // Check filesize
        $return_info['status'] = 'error';
        $return_info['info'] = 'File size is too large. Php is set to 10MB';
    }
    if (!is_writable($upload_path)) { // Check upload path
        $return_info['status'] = 'error';
        $return_info['info'] = 'Upload directory is not writable';
    }
    if(!is_writable('images/uploads/') || !is_writable('images/crops/') || !is_writable('images/thumbnails/')) { // Check to make sure image folders are writeable
        $return_info['status'] = 'error';
        $return_info['info'] = 'Make sure images folders are writeable';
    }

    // Upload file
    if ($return_info['status'] != 'error') {
        $original = new edit_image();
        $original->load($file_temp);
        $original->save($file_path);

        $return_info['status'] = 'success';
        $return_info['file'] = array(
            'name' => $file_name,
            'path' => $file_path,
            'size' => filesize($file_path),
            'width' => $original->getWidth(),
            'height' => $original->getHeight(),
            'type' => $original->getType()
        );
        $return_info['info'] = '';

        if($thumbnail){
            $return_info['thumbnail'] = thumbnail($file_name, $file_path, $file_width, $file_height, $file_type);
        }
    }

    // Return file info
    echo json_encode($return_info);
}

function crop() {
    // Grab crop post variables
    $post_name = $_POST['post_name'];
    $image_name = $_POST[$post_name];
    $image_path = $_POST[$post_name.'_path'];
    $crop_w = $_POST['w'];
    $crop_h = $_POST['h'];
    $crop_x = $_POST['x'];
    $crop_y = $_POST['y'];
    $upload_path = 'images/crops/'; // Crops location - trailing slash
    
    // Should we send back a thumbnail
    $thumbnail = true;

    // Start new class
    $crop = new edit_image();

    // Resize to new folder
    $crop->load($image_path);
    $crop->crop($crop_w, $crop_h, $crop_x, $crop_y);
    $crop->save($upload_path.$image_name);

    $return_info = array(
        'status' => 'success',
        'file' => array(
            'name' => $image_name,
            'path' => $upload_path.$image_name,
            'size' => filesize($upload_path.$image_name),
            'width' => $crop->getWidth(),
            'height' => $crop->getHeight(),
            'type' => $crop->getType()
        ),
        'info' => ''
    );

    if($thumbnail){
        $return_info['thumbnail'] = thumbnail($image_name, $upload_path.$image_name, $crop->getWidth(), $crop->getHeight());
    }

    echo json_encode($return_info);
}

function thumbnail($image_name, $image_path, $image_width, $image_height) {
    // Thumbnail settings
    $thumbnail_path = 'images/thumbnails/';
    $thumbnail_height = 150;
    $thumbnail_width = 150;

    // Start new class
    $thumb = new edit_image();

    // Resize to new folder
    $thumb->load($image_path);
    if($image_width > $image_height) {
        $thumb->resizeToWidth($thumbnail_width);
    } else {
        $thumb->resizeToHeight($thumbnail_height);
    }
    $thumb->save($thumbnail_path.$image_name);

    return array(
        'name' => $image_name,
        'path' => $thumbnail_path.$image_name,
        'size' => filesize($thumbnail_path.$image_name),
        'width' => $thumb->getWidth(),
        'height' => $thumb->getHeight(),
        'type' => $thumb->getType()
    );
}


/*
* File: SimpleImage.php
* Author: Simon Jarvis
* Copyright: 2006 Simon Jarvis
* Date: 08/11/06
* Link: http://www.white-hat-web-design.co.uk/articles/php-image-resizing.php
*/
class edit_image {

    public $image;
    public $image_type;
    public $image_type_text;

    function load($filename) {
        $image_info = getimagesize($filename);
        $this->image_type = $image_info[2];
        if ($this->image_type == IMAGETYPE_JPEG) {
            $this->image_type_text = 'jpg';
            $this->image = imagecreatefromjpeg($filename);
        } elseif ($this->image_type == IMAGETYPE_GIF) {
            $this->image_type_text = 'gif';
            $this->image = imagecreatefromgif($filename);
        } elseif ($this->image_type == IMAGETYPE_PNG) {
            $this->image_type_text = 'png';
            $this->image = imagecreatefrompng($filename);
        }
    }

    function save($filename, $compression = 100, $permissions = 0777) {
        if ($this->image_type == IMAGETYPE_JPEG) {
            imagejpeg($this->image, $filename, $compression);
        } elseif ($this->image_type == IMAGETYPE_GIF) {
            imagegif($this->image, $filename);
        } elseif ($this->image_type == IMAGETYPE_PNG) {
            imagepng($this->image, $filename);
        }
        if ($permissions) {
            chmod($filename, $permissions);
        }
    }

    function output($image_type = IMAGETYPE_JPEG) {
        if ($image_type == IMAGETYPE_JPEG) {
            imagejpeg($this->image);
        } elseif ($image_type == IMAGETYPE_GIF) {
            imagegif($this->image);
        } elseif ($image_type == IMAGETYPE_PNG) {
            imagepng($this->image);
        }
    }

    function getWidth() {
        return imagesx($this->image);
    }

    function getHeight() {
        return imagesy($this->image);
    }

    function getType() {
        return $this->image_type_text;
    }

    function resizeToHeight($height) {
        $ratio = $height / $this->getHeight();
        $width = $this->getWidth() * $ratio;
        $this->resize($width, $height);
    }

    function resizeToWidth($width) {
        $ratio = $width / $this->getWidth();
        $height = $this->getheight() * $ratio;
        $this->resize($width, $height);
    }

    function scale($scale) {
        $width = $this->getWidth() * $scale / 100;
        $height = $this->getheight() * $scale / 100;
        $this->resize($width, $height);
    }

    function resize($width, $height) {
        $new_image = imagecreatetruecolor($width, $height);
        imagecopyresampled($new_image, $this->image, 0, 0, 0, 0, $width, $height, $this->getWidth(), $this->getHeight());
        $this->image = $new_image;
    }

    function crop($crop_w, $crop_h, $crop_x, $crop_y) {
        $new_image = imagecreatetruecolor($crop_w, $crop_h);
        imagecopy($new_image, $this->image, 0, 0, $crop_x, $crop_y, $this->getWidth(), $this->getHeight());
        $this->image = $new_image;
    }

}

?>