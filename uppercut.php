<?php
   	// Options
	$allowed_types = array('.jpg','.gif','.bmp','.png'); // Allowed file types
	$max_size = 2097152; // Maximum filesize in bytes (currently 2MB).
	$upload_path = 'uploads/'; // Upload location - trailing slash

	// Return info
	$return_info = array('status' => '', 'file' => array('name' => '', 'path' => '', 'size' => '', 'type' => '', 'ext' => ''), 'info' => '');

	// File Info
	$name = 'uc_image';
	$file_name = $_FILES[$name]['name'];
	$file_temp = $_FILES[$name]['tmp_name'];
	$file_size = $_FILES[$name]['size'];
	$file_type = $_FILES[$name]['type'];
	$file_path = $upload_path.$file_name;
	$file_ext = substr($file_name, strpos($file_name,'.'), strlen($file_name)-1);

	// Validate
	if(!in_array($file_ext, $allowed_types)) { // Check file types
		$return_info['status'] = 'error';
		$return_info['info'] = 'File type is not allowed';
	}
	if(filesize($file_temp) > $max_size) { // Check filesize
		$return_info['status'] = 'error';
		$return_info['info'] = 'File size is too large';
	}
	if(!is_writable($upload_path)) { // Check upload path
		$return_info['status'] = 'error';
		$return_info['info'] = 'Upload directory is not writable';
	}

	// Upload file
	if($return_info['status'] != 'error') {
		move_uploaded_file($file_temp, $file_path);

		$return_info['status'] = 'success';
		$return_info['file'] = array(
			'name' => $file_name,
			'path' => $file_path,
			'size' => $file_size,
			'type' => $file_type,
			'ext' => $file_ext
		);
		$return_info['info'] = '';
	}

	// Return file info
	echo json_encode($return_info);

?>