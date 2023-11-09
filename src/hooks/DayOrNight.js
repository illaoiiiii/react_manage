import moment from "moment/moment.js";

export function useDayOrNight(){
    const formattedTime = moment().format('MMMM Do YYYY, h:mm:ss a');
    return  formattedTime.split(" ").pop()
}

