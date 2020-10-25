from datetime import datetime
import os
if os.path.isfile('text.txt'):
  try: 
    f=open("text.txt", 'r')
    read = f.read()
    f.close()

    f=open('text.txt', 'w')
    
    list_data = read.split(',')
    date = str(datetime.today().day)
    count = str(int(list_data[0])+1)
    # print(int(list_data[0]))
    if int(list_data[1]) != datetime.today().day:
      count = 1
      # print(count)
    
    str_data = str(count +','+ date)
    f.write(str_data)
    f.close()
    print(str_data)
    # print(list_data)

  except Exception as ex:
    f=open('text.txt', 'w')
    default = '1'+','+ str(datetime.today().day) 
    f.write(default)
    f.close()
    
else:
  f=open('text.txt', 'w')
  default = '1'+','+ str(datetime.today().day)
  f.write(default)
  f.close()
  
