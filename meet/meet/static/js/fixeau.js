class Api {
	constructor(url) {
		this.url = url;
		this.token = undefined;
	}
	
	login(username, password) {
		return $.post(`${this.url}/token/`, {username: username, password: password})
			.then(data => {
				this.token = data.token;
				return this.token;
			})
	}
	
	get(url, data) {
		return $.ajax({
			url: url,
			data: data,
			headers: {'Authorization': 'JWT ' + this.token}
		})
	}
	
	getPages(url, options={}) {
		return this.get(url,options.params).then(async data => {
			let items = data.results || data;
			if (options.onPage) {
				options.onPage(items);
			}
			if (data.next) {
				let more = await this.getPages(data.next, options);
				return items.concat(more);
			}
			else {
				return items;
			}
		})
	}
	
	getUserData() {
		return this.get(`${this.url}/user/me`);
	}

	getSources(options) {
		return this.getPages(`${this.url}/source/`, options);
	}
	
	getSeries(options) {
		return this.getPages(`${this.url}/series/`, options);
	}

	getSeriesObject(id) {
		return this.get(`${this.url}/series/${id}/`);
	}
	
	getSeriesData(id, options) {
		let params = {params:{format:'json'}};
		return this.getPages(`${this.url}/series/${id}/data/`, {...params, ...options});
	}

	getMeasurements(options) {
		return this.getPages(`${this.url}/measurement/`, options);
	}
}
