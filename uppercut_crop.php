<?php
   	// Grab crop post variables
	$image_path = $_POST['image_path'];
	$image_name = $_POST['image_name'];
	$crop_x = $_POST['x'];
	$crop_y = $_POST['y'];
	$crop_h = $_POST['h'];
	$crop_w = $_POST['w'];
	 
	// Get image width and height
	list($image_width, $image_height, $image_type, $image_attr) = getimagesize($image_path);
    $image_type = getimagesize($image_path)['mime'];
    $image_ext = explode('/', $image_type)[1];
	 
	// Crop image
	$canvas = imagecreatetruecolor($crop_w, $crop_h);
	$current_image = imagecreatefromjpeg($image_path);
	imagecopy($canvas, $current_image, 0, 0, $crop_x, $crop_y, $image_width, $image_height);

	// Save Image
	switch($image_ext) {
        case 'jpg':
        case 'jpeg':
            imagejpeg($canvas, $image_path, 100);
            break;
        case 'gif':
            imagegif($canvas, $image_path);
            break;
        case 'png':
            imagepng($canvas, $image_path, 9);
            break;  
    }

	// Get file height and width
	list($image_width, $image_height, $image_type, $image_attr) = getimagesize($image_path);
    $image_type = getimagesize($image_path)['mime'];
	$image_ext = explode('/', $image_type)[1];

	// Return file info
	echo json_encode(array(
        'status' => 'success', 
        'file' => array(
            'name' => $image_name, 
            'path' => $image_path, 
            'size' => '', 
            'height' => $image_height, 
            'width' => $image_height, 
            'type' => $image_type
        ), 
        'info' => ''
    ));

?>