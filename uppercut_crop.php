<?php
   	// Grab crop post variables
	$image_path = $_POST['image_path'];
	$image_name = $_POST['image_name'];
	$crop_x = $_POST['x'];
	$crop_y = $_POST['y'];
	$crop_h = $_POST['h'];
	$crop_w = $_POST['w'];
    $upload_path = 'crops/'; // Crops location - trailing slash

    // Copy to new folder
    copy($image_path, $upload_path.$image_name);
    $image_path = $upload_path.$image_name;
	 
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
	echo json_encode(array(
        'status' => 'success', 
        'file' => array(
            'name' => $image_name, 
            'path' => $image_path, 
            'size' => filesize($image_path), 
            'height' => $image_height, 
            'width' => $image_height, 
            'type' => $image_ext
        ), 
        'info' => ''
    ));

?>