<?php

if (isset($_POST) && !empty($_POST)) {
	if($_POST['request']=='urls') {
		// Create variables
		$urls = array(
					"about"=>"",
					"credits"=>"",
					"support"=>"",
					"rate"=>"https://marketplace.firefox.com/app/firetext/ratings/add",
					"dropboxAuth"=>"https://codexa.github.io/firetext/auth/dropbox/"
				);
	
		// Echo variables
		header('Content-Type: application/json');
		header('Access-Control-Allow-Origin: *');
		echo json_encode($urls);
		exit;
	}
}
