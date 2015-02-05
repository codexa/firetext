<?php

if (isset($_POST) && !empty($_POST)) {
	if($_POST['request']=='urls') {
		// Create variables
		$urls = array(
					"about"=>"",
					"credits"=>"",
					"support"=>"",
					"rate"=>"https://marketplace.firefox.com/app/firetext/ratings/add",
					"dropboxAuth"=>"http://firetext.codexa.bugs3.com/auth/dropbox/"
				);
	
		// Echo variables
		header('Content-Type: application/json');
		header('Access-Control-Allow-Origin: *');
		echo json_encode($urls);
		exit;
	}
}
