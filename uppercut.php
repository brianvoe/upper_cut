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
    $upload_path = 'uploads/'; // Upload location - trailing slash
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
    $name = 'uc_image';
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

    // Upload file
    if ($return_info['status'] != 'error') {
        $move_file = move_uploaded_file($file_temp, $file_path);
        if (!$move_file) {
            $return_info['status'] = 'error';
            $return_info['info'] = 'There was a problem moving image.';
        } else {
            // Set permissions
            chmod($file_path, 0777);

            // Get file height and width
            list($file_width, $file_height, $type, $attr) = getimagesize($file_path);

            $return_info['status'] = 'success';
            $return_info['file'] = array(
                'name' => $file_name,
                'path' => $file_path,
                'size' => $file_size,
                'height' => $file_height,
                'width' => $file_width,
                'type' => $file_type
            );
            $return_info['info'] = '';
        }
    }

    // Return file info
    echo json_encode($return_info);
}

function crop() {
    // Grab crop post variables
    $image_path = $_POST['image_path'];
    $image_name = $_POST['image_name'];
    $crop_x = $_POST['x'];
    $crop_y = $_POST['y'];
    $crop_h = $_POST['h'];
    $crop_w = $_POST['w'];
    $upload_path = 'crops/'; // Crops location - trailing slash
    // Thumbnail settings
    $thumbnail = true;
    $thumbnail_path = 'thumbnails/';
    $thumbnail_height = 150;
    $thumbnail_width = 150;

    // Copy to new folder
    copy($image_path, $upload_path . $image_name);
    $image_path = $upload_path . $image_name;

    // Set permissions
    chmod($image_path, 0777);

    // Get image width and height
    list($image_width, $image_height, $image_type, $image_attr) = getimagesize($image_path);
    $image_type = getimagesize($image_path);
    $image_type = $image_type['mime'];
    $image_ext = explode('/', $image_type);
    $image_ext = $image_ext[1];

    // Crop image
    $canvas = imagecreatetruecolor($crop_w, $crop_h);

    // Save Image
    switch ($image_ext) {
        case 'jpg':
        case 'jpeg':
            $current_image = imagecreatefromjpeg($image_path);
            imagecopy($canvas, $current_image, 0, 0, $crop_x, $crop_y, $image_width, $image_height);
            imagejpeg($canvas, $image_path, 100);
            break;
        case 'gif':
            $current_image = imagecreatefromgif($image_path);
            imagecopy($canvas, $current_image, 0, 0, $crop_x, $crop_y, $image_width, $image_height);
            imagegif($canvas, $image_path);
            break;
        case 'png':
            $current_image = imagecreatefrompng($image_path);
            imagecopy($canvas, $current_image, 0, 0, $crop_x, $crop_y, $image_width, $image_height);
            imagepng($canvas, $image_path, 9);
            break;
    }

    // Get file height and width
    list($image_width, $image_height, $image_type, $image_attr) = getimagesize($image_path);
    $image_type = getimagesize($image_path);
    $image_type = $image_type['mime'];
    $image_ext = explode('/', $image_type);
    $image_ext = $image_ext[1];

    // Return file info
    $return_info = array(
        'status' => 'success',
        'file' => array(
            'name' => $image_name,
            'path' => $image_path,
            'size' => filesize($image_path),
            'height' => $image_height,
            'width' => $image_width,
            'type' => $image_ext
        ),
        'info' => ''
    );

    echo json_encode($return_info);
}

function thumbnail() {
    // Create thumbnail to also send back
    // Copy to new folder
    copy($image_path, $thumbnail_path . $image_name);
    $image_path = $thumbnail_path . $image_name;

    // Set permissions
    chmod($image_path, 0777);

    // Get ratio
    if ($image_width > $image_height) {
        //$thumbnail_height = $thumbnail_height * ($image_width / $image_height);
        $thumbnail_width = $image_width = $image_width * ($thumbnail_height / $image_height);
    } else {
        //$thumbnail_width = $thumbnail_width * ($thumbnail_width / $image_width);
        $thumbnail_height = $image_height = $image_height * ($thumbnail_width / $image_width);
    }

    // Set Canvas
    $canvas = imagecreatetruecolor($thumbnail_width, $thumbnail_height);

    // function resizeToHeight($height) {
    //     $ratio = $height / $this->getHeight();
    //     $width = $this->getWidth() * $ratio;
    //     $this->resize($width,$height);
    // }
    // function resizeToWidth($width) {
    //     $ratio = $width / $this->getWidth();
    //     $height = $this->getheight() * $ratio;
    //     $this->resize($width,$height);
    // }
    // Save Image
    switch ($image_ext) {
        case 'jpg':
        case 'jpeg':
            $current_image = imagecreatefromjpeg($image_path);
            //imagecopy($canvas, $current_image, 0, 0, $crop_x, $crop_y, $image_width, $image_height);
            imagecopyresized($canvas, $current_image, 0, 0, 0, 0, $thumbnail_width, $thumbnail_height, $image_width, $image_height);
            imagejpeg($canvas, $image_path, 100);
            break;
        case 'gif':
            $current_image = imagecreatefromgif($image_path);
            //imagecopy($canvas, $current_image, 0, 0, $crop_x, $crop_y, $image_width, $image_height);
            imagecopyresized($canvas, $current_image, 0, 0, 0, 0, $thumbnail_width, $thumbnail_height, $image_width, $image_height);
            imagegif($canvas, $image_path);
            break;
        case 'png':
            $current_image = imagecreatefrompng($image_path);
            //imagecopy($canvas, $current_image, 0, 0, $crop_x, $crop_y, $image_width, $image_height);
            imagecopyresized($canvas, $current_image, 0, 0, 0, 0, $thumbnail_width, $thumbnail_height, $image_width, $image_height);
            imagepng($canvas, $image_path, 9);
            break;
    }

    $return_info['thumbnail'] = array(
        'name' => $image_name,
        'path' => $image_path,
        'size' => filesize($image_path),
        'height' => $thumbnail_height,
        'width' => $thumbnail_width,
        'type' => $image_ext
    );
}

class edit_image {

    var $image;
    var $image_type;

    function load($filename) {
        $image_info = getimagesize($filename);
        $this->image_type = $image_info[2];
        if ($this->image_type == IMAGETYPE_JPEG) {
            $this->image = imagecreatefromjpeg($filename);
        } elseif ($this->image_type == IMAGETYPE_GIF) {
            $this->image = imagecreatefromgif($filename);
        } elseif ($this->image_type == IMAGETYPE_PNG) {

            $this->image = imagecreatefrompng($filename);
        }
    }

    function save($filename, $image_type = IMAGETYPE_JPEG, $compression = 75, $permissions = null) {

        if ($image_type == IMAGETYPE_JPEG) {
            imagejpeg($this->image, $filename, $compression);
        } elseif ($image_type == IMAGETYPE_GIF) {

            imagegif($this->image, $filename);
        } elseif ($image_type == IMAGETYPE_PNG) {

            imagepng($this->image, $filename);
        }
        if ($permissions != null) {

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

}

?>