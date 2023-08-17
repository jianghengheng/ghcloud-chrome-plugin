const injectConfig = {
	// 微应用配置
	microApps: [
	],
};

chrome.storage.local.get().then((res) => {
	for (const key in res) {
		const element = res[key];
		if (element.applyType === "keyValue") {
			injectConfig[key] = element.value;
		}
		if (element.applyType === "microApps") {
			injectConfig.microApps.push({ name: key, entry: element.value });
		}
	}
	window.name = JSON.stringify(injectConfig);
});
