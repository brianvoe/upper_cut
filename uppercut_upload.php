<?php

	// Options
	$allowed_types = array('jpg','jpeg','gif','bmp','png'); // Allowed file types
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
	if($file_type) {
		$file_type = explode('/', $file_type);
		$file_type = $file_type[1];
	} else {
		$file_type = substr(strrchr($file_name, '.'), 1);
	}
	$file_path = $upload_path.$file_name;

	// Validate
	if(!in_array($file_type, $allowed_types)) { // Check file types
		$return_info['status'] = 'error';
		$return_info['info'] = 'File type is not allowed';
	}
	if(filesize($file_temp) > $max_size) { // Check filesize
		$return_info['status'] = 'error';
		$return_info['info'] = 'File size is too large. Php is set to 10MB';
	}
	if(!is_writable($upload_path)) { // Check upload path
		$return_info['status'] = 'error';
		$return_info['info'] = 'Upload directory is not writable';
	}

	// Upload file
	if($return_info['status'] != 'error') {
		$move_file = move_uploaded_file($file_temp, $file_path);
		if(!$move_file) {
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

?>