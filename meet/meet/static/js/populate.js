const api = new Api('https://test.fixeau.com/api/v1');
const dateOptions = {year: 'numeric', month: 'short', day: '2-digit'};

function addItem(map,list,item) {
	let date = "";
	let value = "";
	if (item.latest) {
		date = new Date(item.latest.time).toLocaleDateString("nl-NL",dateOptions);
		value = `${item.latest.value.toPrecision(3)} ${item.latest.unit}`;
	}
	list.append(`<a class="list-group-item list-group-item-action" 
		href="/chart/${item.id}/" onmouseover="showMarker(${item.id});" onmouseout="hideMarker();">
		${item.name}
		<span class="float-right"><small>${date}</small></span><br>
		<small>${item.description}<span class="float-right">${value}</span></small></a>`);
	addMarker(map, item);
}

function populateUser(map,list) {
	return api.getUserData().then(user => {
		let badge = $(".badge");
		let items = 0;
		let sources = user.datasource_set;
		sources.forEach(source => {
			api.getSeries({params: {source:source}, onPage: page => {
				page.forEach(item => {
					addItem(map,list,item);
					items++;
				});
				badge.html(`${items}`);
			}})
		});
		return {user:user, items:items};
	})
}

function populate(map,list) {
	api.getUserData().then(user => {
		let badge = $(".badge");
		let name = $(".name");
		let items = 0;
		name.html("Laden...");
		api.getSeries({onPage: page => {
			page.forEach(item => {
				addItem(map,list,item);
				items++;
			});
			badge.html(`${items}`);
		}})
		.then(series => {
			badge.html(`${series.length}`);
			name.html(`${user.first_name} ${user.last_name}`);
		})
		.catch(error => {
			// error retrieving time series
			$(".error").html(error.responseText);	
			name.html(`${user.first_name} ${user.last_name}`);
		})
	})
	.catch(error => {
		// error loading user data
		$(".error").html(error.responseText);	
	})
}
