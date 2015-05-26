IF EXIST "../locales" (
	rmdir "../locales" /s /q
)
mkdir "../locales"

tx init
tx pull -r firetext.appproperties -a -s --minimum-perc 100