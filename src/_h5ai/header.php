<!DOCTYPE html>
<!--[if lt IE 7]> <html class="h5ai-php no-js ie6 oldie" lang="en"> <![endif]-->
<!--[if IE 7]>    <html class="h5ai-php no-js ie7 oldie" lang="en"> <![endif]-->
<!--[if IE 8]>    <html class="h5ai-php no-js ie8 oldie" lang="en"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="h5ai-php no-js" lang="en"> <!--<![endif]-->
<?php include "php/main.php"; ?>
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
	<title><?php echo $h5ai->getTitle(); ?></title>
	<meta name="h5ai-version" content="h5ai %BUILD_VERSION% (php)">
	<meta name="description" content="Directory index styled with h5ai (http://larsjung.de/h5ai)">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="shortcut icon" type="image/png" href="/_h5ai/images/h5ai-16x16.png">
	<link rel="apple-touch-icon" type="image/png" href="/_h5ai/images/h5ai-48x48.png">
	<link rel="stylesheet" href="http://fonts.googleapis.com/css?family=Ubuntu:regular,italic,bold">
	<link rel="stylesheet" href="/_h5ai/css/styles.css">
	<script src="/_h5ai/js/modernizr.min.js"></script>
	<!--[if lt IE 9]><script src="//html5shiv.googlecode.com/svn/trunk/html5.js"></script><![endif]-->
</head>
<body>
	<nav class="clearfix">
		<ul id="navbar">
			<?php echo $crumb->toHtml(); ?>
		</ul>
	</nav>
	<?php echo $tree->toHtml(); ?>
	<section id="content">
		<?php echo $customize->getHeader(); ?>
		<?php echo $extended->toHtml(); ?>
		<?php echo $customize->getFooter(); ?>
		<section id="table" class="hideOnJs">
			<!-- The following code was generated by Apache's autoindex module and gets ignored and removed from the DOM tree. -->
