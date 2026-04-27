// calendar.js
document.addEventListener("DOMContentLoaded", () => {
    
    // Элементы DOM
    const monthYearText = document.getElementById("monthYear");
    const calendarDaysContainer = document.getElementById("calendarDays");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");

    const monthNames = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ];

    let currentDate = new Date();
    let selectedDate = null; // Изначально ничего не выбрано

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // 1. Обновляем заголовок
        monthYearText.textContent = `${monthNames[month]} ${year}`;

        // 2. Расчет дней
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // День недели 1-го числа
        const daysInMonth = new Date(year, month + 1, 0).getDate(); // Кол-во дней в месяце

        // Корректировка для русской недели (Пн - первый день)
        // getDay(): Вс=0, Пн=1... Сб=6. Нам нужно: Пн=0... Вс=6
        const startDayIndex = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

        calendarDaysContainer.innerHTML = "";

        // 3. Пустые ячейки до начала месяца
        for (let i = 0; i < startDayIndex; i++) {
            const emptyCell = document.createElement("div");
            calendarDaysContainer.appendChild(emptyCell);
        }

        // 4. Дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement("div");
            dayCell.textContent = day;
            
            // Базовые стили Tailwind для ячейки
            let baseClasses = "h-8 w-8 flex items-center justify-center rounded-full cursor-pointer transition-all text-sm";
            
            // Проверка: является ли этот день выбранным
            const isSelected = selectedDate && 
                               selectedDate.getDate() === day && 
                               selectedDate.getMonth() === month && 
                               selectedDate.getFullYear() === year;

            if (isSelected) {
                dayCell.className = `${baseClasses} bg-white/40 font-bold text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]`;
            } else {
                dayCell.className = `${baseClasses} hover:bg-white/20 text-white/80`;
            }

            // Событие клика
            dayCell.addEventListener("click", () => {
                selectedDate = new Date(year, month, day);
                renderCalendar(); // Перерисовать, чтобы обновить подсветку
                console.log(`Выбрана дата: ${day}.${month + 1}.${year}`);
                // Здесь можно добавить логику подгрузки задач для этой даты
            });

            calendarDaysContainer.appendChild(dayCell);
        }
    }

    // Обработчики кнопок
    prevMonthBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Первичный запуск
    renderCalendar();
});