import { setScreen } from "../util/screen.js"
import { renderMessageScreen } from "./message.js"
import { censorAddress } from "../util/address.js"

const screen = document.querySelector(".inboxScreen")
const $ = (str) => screen.querySelector(str)

// delete button
$(".delete").onclick = () => {
	$(".deleteConfirm").style.display = "block"
}

// cancel delete button
$(".deleteConfirm .cancel").onclick = () => {
	$(".deleteConfirm").style.display = "none"
}

// render screen
export const renderInboxScreen = (
	api,
	{ id, name, address },
	revealAddress
) => {
	// name
	$(".name").innerText = name

	// hidden address
	const addressButton = document.createElement("button")
	addressButton.className = "address"
	addressButton.innerText = censorAddress(address)
	$(".address").replaceWith(addressButton)

	// revealed address
	const revealedAddressText = document.createElement("p")
	revealedAddressText.className = "address"
	revealedAddressText.innerText = address

	// click to reveal address
	if (revealAddress) addressButton.replaceWith(revealedAddressText)
	else
		addressButton.onclick = () => addressButton.replaceWith(revealedAddressText)

	// back button
	let onBack
	$(".back").onclick = () => {
		onBack?.()
		setScreen("home")
	}

	// delete
	$(".deleteConfirm").style.display = "none"
	$(".deleteConfirm .confirm").onclick = () => {
		api.inboxDelete(id).then(() => {
			// remove inbox from home screen list
			document
				.querySelector(`.homeScreen .inbox[data-inbox-id="${id}"]`)
				?.remove()

			// return to home screen
			setScreen("home")
		})
	}

	// loading
	$(".loading").style.display = "block"
	$(".empty").style.display = "none"
	$(".messages").style.display = "none"

	// fetch messages
	api.inboxGet(id).then((inbox) => {
		// render messages list
		$(".loading").style.display = "none"
		renderMessagesList(api, inbox.messages)

		// inbox refetch interval
		const interval = startInboxRefetchInterval(api, id)
		onBack = () => clearInterval(interval)
	})
}

// inbox refetch interval
const startInboxRefetchInterval = (api, id) =>
	setInterval(() => {
		api.inboxGet(id).then((inbox) => renderMessagesList(api, inbox.messages))
	}, 5000)

// render messages list
const renderMessagesList = (api, messages) => {
	if (messages.length === 0) {
		$(".empty").style.display = "block"
		$(".messages").style.display = "none"
	} else {
		$(".empty").style.display = "none"
		$(".messages").style.display = "block"
		$(".messages").innerHTML = ""
		$(".messages").append(
			...messages.map((message) => createMessage(api, message))
		)
	}
}

// create message list row
const createMessage = (api, { id, fromName, fromAddress, subject, date }) => {
	const message = document.createElement("button")
	message.className = "message"

	message.onclick = () => {
		renderMessageScreen(api, { id, fromName, fromAddress, subject, date })
		setScreen("message")
	}

	const subjectText = document.createElement("p")
	subjectText.className = "subject"
	subjectText.innerText = subject

	const dateStr = Intl.DateTimeFormat(undefined, {
		day: "2-digit",
		month: "2-digit",
		year: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date))

	const fromText = document.createElement("p")
	fromText.className = "from"
	fromText.innerText = `${dateStr} - ${fromAddress}`

	message.append(subjectText, fromText)
	return message
}
