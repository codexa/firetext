var dropAPI = {};

dropAPI.client = new Dropbox.Client({
    key: "CBB0GYTWGYA=|aeSB7VBcIP94mzfQPoykIzGm++Z97KtaDn2snjXCGQ=="
});

dropAPI.client.authDriver(new Dropbox.Drivers.Popup({
    receiverUrl: "http://firetext.co.nf/dropbox-thanks"}));
