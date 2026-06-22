const ids = ["1Gg9pmvCjT3KY2ON8dm5jZ-ltMOniRbht", "1Uae_TS8WmEpaSmrwlW0qnAR6eCe1LwiY"];
Promise.all(ids.map(id => {
  const url = `https://lh3.googleusercontent.com/d/${id}`;
  return fetch(url, { method: "HEAD" })
    .then(res => ({ id, status: res.status, ok: res.ok }))
    .catch(err => ({ id, error: err.message }));
})).then(results => console.log(results));
