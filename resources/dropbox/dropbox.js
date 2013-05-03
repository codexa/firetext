var dropAPI = {};

var dropAPI.client = new Dropbox.Client({
    key: "CBB0GYTWGYA=|aeSB7VBcIP94mzfQPoykIzGm++Z97KtaDn2snjXCGQ=="
});

dropAPI.client.authDriver(new Dropbox.Drivers.Redirect());
