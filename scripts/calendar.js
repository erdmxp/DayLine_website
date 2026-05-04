document.addEventListener("DOMContentLoaded", () => {
    const monthYearText = document.getElementById("monthYear");
    const calendarDaysContainer = document.getElementById("calendarDays");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");

    const monthNames = [
        "Январь","Февраль","Март","Апрель","Май","Июнь",
        "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
    ];

    const today = new Date();
    let currentDate = new Date();

    // selectedDate — сегодня по умолчанию
    let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Функция для перевода даты в строку YYYY-MM-DD
    window.getSelectedDateStr = function() {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearText.textContent = `${monthNames[month]} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDayIndex = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

        calendarDaysContainer.innerHTML = "";

        for (let i = 0; i < startDayIndex; i++) {
            calendarDaysContainer.appendChild(document.createElement("div"));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement("div");
            dayCell.textContent = day;

            const base = "h-8 w-8 flex items-center justify-center rounded-full cursor-pointer transition-all text-sm mx-auto";

            const isSelected = selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === month &&
                selectedDate.getFullYear() === year;

            const isToday =
                today.getDate() === day &&
                today.getMonth() === month &&
                today.getFullYear() === year;

            if (isSelected) {
                dayCell.className = `${base} bg-white/40 font-bold text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]`;
            } else if (isToday) {
                dayCell.className = `${base} border border-white/40 text-white`;
            } else {
                dayCell.className = `${base} hover:bg-white/20 text-white/80`;
            }

            dayCell.addEventListener("click", () => {
                selectedDate = new Date(year, month, day);
                renderCalendar();
                // Сообщаем todo.js что дата изменилась
                window.dispatchEvent(new CustomEvent('dateSelected', {
                    detail: { date: window.getSelectedDateStr() }
                }));
            });

            calendarDaysContainer.appendChild(dayCell);
        }
    }

    prevMonthBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    renderCalendar();

    // Сообщаем todo.js о начальной дате после загрузки
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dateSelected', {
            detail: { date: window.getSelectedDateStr() }
        }));
    }, 0);
});