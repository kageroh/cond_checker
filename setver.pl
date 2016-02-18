#! /usr/bin/perl
# scan JSON
$ver_name = "?";
$JSON="manifest.json";
open(JSON) || die "error :$!";
while (<JSON>) {
	$ver_name = $1 if /^\s*"version_name": "(.+)",/;
}
system qq!perl -p -i.bak -e "s/^\\* v\\d.+:/* $ver_name:/ if 2..5;" README.md!;
system qq!perl -p -i.bak -e "s/(var ver_name =) .+;/\\1 '$ver_name';/ if /manifest\.json/;" content.js!;
