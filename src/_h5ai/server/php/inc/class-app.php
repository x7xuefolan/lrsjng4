<?php

class App {

	private static $RE_DELIMITER = "|";


	private $options;


	public function __construct() {

		$this->options = load_commented_json(APP_PATH . "/conf/options.json");
	}


	public function get_options() {

		return $this->options;
	}


	public function get_setup() {

		$consts = get_defined_constants(true)["user"];
		$consts["PHP_VERSION"] = PHP_VERSION;
		return $consts;
	}


	public function get_types() {

		return load_commented_json(APP_PATH . "/conf/types.json");
	}


	public function to_url($path, $trailing_slash = true) {

		$rel_path = substr($path, strlen(ROOT_PATH));
		$parts = explode("/", $rel_path);
		$encoded_parts = array();
		foreach ($parts as $part) {
			if ($part) {
				$encoded_parts[] = rawurlencode($part);
			}
		}

		return normalize_path(ROOT_HREF . implode("/", $encoded_parts), $trailing_slash);
	}


	public function to_path($url) {

		$rel_url = substr($url, strlen(ROOT_HREF));
		return normalize_path(ROOT_PATH . "/" . rawurldecode($rel_url));
	}


	public function is_ignored($name) {

		// always ignore
		if ($name === "." || $name === "..") {
			return true;
		}

		foreach ($this->options["view"]["ignore"] as $re) {
			$re = App::$RE_DELIMITER . str_replace(App::$RE_DELIMITER, '\\' . App::$RE_DELIMITER, $re) . App::$RE_DELIMITER;
			if (preg_match($re, $name)) {
				return true;
			}
		}

		return false;
	}


	public function read_dir($path) {

		$names = array();
		if (is_dir($path)) {
			if ($dir = opendir($path)) {
				while (($name = readdir($dir)) !== false) {
					if (!$this->is_ignored($name) && !$this->is_ignored($this->to_url($path) . $name)) {
						$names[] = $name;
					}
				}
				closedir($dir);
			}
		}
		return $names;
	}


	public function is_managed_url($url) {

		return $this->is_managed_path($this->to_path($url));
	}


	public function is_managed_path($path) {

		if (!is_dir($path) || strpos($path, '../') || strpos($path, '/..') || $path == '..') {
			return false;
		}

		foreach ($this->options["view"]["indexFiles"] as $name) {
			if (file_exists($path . "/" . $name)) {
				return false;
			}
		}

		while ($path !== ROOT_PATH) {
			if (@is_dir($path . "/_h5ai/server")) {
				return false;
			}
			$parent_path = normalize_path(dirname($path));
			if ($parent_path === $path) {
				return false;
			}
			$path = $parent_path;
		}
		return true;
	}


	public function get_items($url, $what) {

		if (!$this->is_managed_url($url)) {
			return array();
		}

		$cache = array();
		$folder = Item::get($this, $this->to_path($url), $cache);

		// add content of subfolders
		if ($what >= 2 && $folder !== null) {
			foreach ($folder->get_content($cache) as $item) {
				$item->get_content($cache);
			}
			$folder = $folder->get_parent($cache);
		}

		// add content of this folder and all parent folders
		while ($what >= 1 && $folder !== null) {
			$folder->get_content($cache);
			$folder = $folder->get_parent($cache);
		}

		uasort($cache, array("Item", "cmp"));
		$result = array();
		foreach ($cache as $p => $item) {
			$result[] = $item->to_json_object();
		}

		return $result;
	}


	public function get_fallback() {

		$cache = array();
		$folder = Item::get($this, CURRENT_PATH, $cache);
		$items = $folder->get_content($cache);
		uasort($items, array("Item", "cmp"));

		$html = "<table>";

		$html .= "<tr>";
		$html .= "<th class='fb-i'></th>";
		$html .= "<th class='fb-n'><span>Name</span></th>";
		$html .= "<th class='fb-d'><span>Last modified</span></th>";
		$html .= "<th class='fb-s'><span>Size</span></th>";
		$html .= "</tr>";

		if ($folder->get_parent($cache)) {
			$html .= "<tr>";
			$html .= "<td class='fb-i'><img src='" . APP_HREF . "client/images/fallback/parent.png' alt='folder-parent'/></td>";
			$html .= "<td class='fb-n'><a href='..'>Parent Directory</a></td>";
			$html .= "<td class='fb-d'></td>";
			$html .= "<td class='fb-s'></td>";
			$html .= "</tr>";
		}

		foreach ($items as $item) {
			$type = $item->is_folder ? "folder" : "file";

			$html .= "<tr>";
			$html .= "<td class='fb-i'><img src='" . APP_HREF . "client/images/fallback/" . $type . ".png' alt='" . $type . "'/></td>";
			$html .= "<td class='fb-n'><a href='" . $item->url . "'>" . basename($item->path) . "</a></td>";
			$html .= "<td class='fb-d'>" . date("Y-m-d H:i", $item->date) . "</td>";
			$html .= "<td class='fb-s'>" . ($item->size !== null ? intval($item->size / 1000) . " KB" : "" ) . "</td>";
			$html .= "</tr>";
		}

		$html .= "</table>";

		return $html;
	}


	public function get_l10n_list() {

		$langs = array();
		$l10n_path = APP_PATH . "/conf/l10n";
		if (is_dir($l10n_path)) {
			if ($dir = opendir($l10n_path)) {
				while (($file = readdir($dir)) !== false) {
					if (ends_with($file, ".json")) {
						$translations = load_commented_json($l10n_path . "/" . $file);
						$langs[basename($file, ".json")] = $translations["lang"];
					}
				}
				closedir($dir);
			}
		}
		ksort($langs);
		return $langs;
	}


	public function get_l10n($iso_codes) {

		if (!is_array($iso_codes)) {
			$iso_codes = func_get_args();
		}

		$results = array();
		foreach ($iso_codes as $iso_code) {
			if ($iso_code !== "") {
				$file = APP_PATH . "/conf/l10n/" . $iso_code . ".json";
				$results[$iso_code] = load_commented_json($file);
				$results[$iso_code]["isoCode"] = $iso_code;
			}
		}

		return $results;
	}


	public function get_customizations($url) {

		if (!$this->options["custom"]["enabled"]) {
			return array(
				"header" => null,
				"footer" => null
			);
		}

		$path = $this->to_path($url);

		$file = $path . "/" . FILE_PREFIX . ".header.html";
		$header = is_readable($file) ? file_get_contents($file) : null;
		$file = $path . "/" . FILE_PREFIX . ".footer.html";
		$footer = is_readable($file) ? file_get_contents($file) : null;

		while ($header === null || $footer === null) {

			if ($header === null) {
				$file = $path . "/" . FILE_PREFIX . ".headers.html";
				$header = is_readable($file) ? file_get_contents($file) : null;
			}
			if ($footer === null) {
				$file = $path . "/" . FILE_PREFIX . ".footers.html";
				$footer = is_readable($file) ? file_get_contents($file) : null;
			}

			if ($path === ROOT_PATH) {
				break;
			}
			$parent_path = normalize_path(dirname($path));
			if ($parent_path === $path) {
				break;
			}
			$path = $parent_path;
		}

		return array(
			"header" => $header,
			"footer" => $footer
		);
	}
}
