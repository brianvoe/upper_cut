<?php
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
    copy($image_path, $upload_path.$image_name);
    $image_path = $upload_path.$image_name;

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
	switch($image_ext) {
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

    if($thumbnail) {
        // Create thumbnail to also send back

        // Copy to new folder
        copy($image_path, $thumbnail_path.$image_name);
        $image_path = $thumbnail_path.$image_name;

        // Set permissions
        chmod($image_path, 0777);

        // Get ratio
        if($image_width > $image_height) {
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
        switch($image_ext) {
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

	echo json_encode($return_info);

?>